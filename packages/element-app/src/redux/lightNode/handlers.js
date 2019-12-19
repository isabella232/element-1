import { withHandlers } from 'recompose';

import config from '../../config';

export default withHandlers({
  predictDID: ({ set, sidetree, getMyDidUniqueSuffix }) => async () => {
    const didUniqueSuffix = await getMyDidUniqueSuffix();
    set({
      predictedDID: `did:elem:${didUniqueSuffix}`,
    });
    const myDidDocument = await sidetree.resolve(didUniqueSuffix, true);
    set({ myDidDocument });
    const operations = await sidetree.db.readCollection(didUniqueSuffix);
    set({ sidetreeOperations: operations });
  },
  getOperationsForDidUniqueSuffix: ({ sidetree, set }) => async (didUniqueSuffix) => {
    set({ loading: true });
    const myDidDocument = await sidetree.resolve(didUniqueSuffix, true);
    set({ didDocumentForOperations: myDidDocument });
    const operations = await sidetree.db.readCollection(didUniqueSuffix);
    set({ sidetreeOperations: operations, loading: false });
  },
  createDID: ({
    snackbarMessage,
    sidetree,
    createDIDRequest,
    getMyDidUniqueSuffix,
    set,
  }) => async () => {
    set({ resolving: true });
    snackbarMessage({
      snackbarMessage: {
        message: 'Creating your DID will take a few minutes....',
        variant: 'info',
        open: true,
      },
    });
    const createReq = await createDIDRequest();
    await sidetree.batchScheduler.writeNow(createReq);
    snackbarMessage({
      snackbarMessage: {
        message: 'DID Created. Resolving....',
        variant: 'info',
        open: true,
      },
    });
    const didUniqueSuffix = await getMyDidUniqueSuffix();
    const myDidDocument = await sidetree.resolve(didUniqueSuffix, true);
    set({ myDidDocument });
    snackbarMessage({
      snackbarMessage: {
        message: `Resolved did:elem:${didUniqueSuffix}`,
        variant: 'success',
        open: true,
      },
    });
    set({ resolving: false });
  },
  addKeyToDIDDocument: ({
    snackbarMessage,
    getMyDidUniqueSuffix,
    createAddKeyRequest,
    set,
    sidetree,
  }) => async (kid, newPublicKey) => {
    set({ resolving: true });
    const didUniqueSuffix = await getMyDidUniqueSuffix();
    const operations = await sidetree.db.readCollection(didUniqueSuffix);
    const lastOperation = operations.pop();
    const { operationHash } = lastOperation.operation;
    const updatePayload = await createAddKeyRequest(
      kid,
      newPublicKey,
      didUniqueSuffix,
      operationHash,
    );
    snackbarMessage({
      snackbarMessage: {
        message: 'This will take a few minutes....',
        variant: 'info',
        open: true,
      },
    });
    await sidetree.batchScheduler.writeNow(updatePayload);
    const myDidDocument = await sidetree.resolve(didUniqueSuffix, true);
    set({ myDidDocument });
    snackbarMessage({
      snackbarMessage: {
        message: 'Key added.',
        variant: 'success',
        open: true,
      },
    });
    set({ resolving: false });
  },
  removeKeyFromDIDDocument: ({
    snackbarMessage,
    getMyDidUniqueSuffix,
    createRemoveKeyRequest,
    set,
    sidetree,
  }) => async (kid) => {
    set({ resolving: true });
    const didUniqueSuffix = await getMyDidUniqueSuffix();
    const operations = await sidetree.db.readCollection(didUniqueSuffix);
    const lastOperation = operations.pop();
    const { operationHash } = lastOperation.operation;
    const updatePayload = await createRemoveKeyRequest(kid, didUniqueSuffix, operationHash);
    snackbarMessage({
      snackbarMessage: {
        message: 'This will take a few minutes....',
        variant: 'info',
        open: true,
      },
    });
    await sidetree.batchScheduler.writeNow(updatePayload);
    const myDidDocument = await sidetree.resolve(didUniqueSuffix, true);
    set({ myDidDocument });
    snackbarMessage({
      snackbarMessage: {
        message: 'Key removed.',
        variant: 'success',
        open: true,
      },
    });
    set({ resolving: false });
  },
  // eslint-disable-next-line
  resolveDID: ({ didResolved, sidetree, snackbarMessage, set }) => async did => {
    set({ resolving: true });
    try {
      const doc = await sidetree.resolve(did, true);
      if (doc) {
        didResolved({ didDocument: doc });
        snackbarMessage({
          snackbarMessage: {
            message: `Resolved ${doc.id}`,
            variant: 'success',
            open: true,
          },
        });
      }
    } catch (e) {
      console.error(e);
      snackbarMessage({
        snackbarMessage: {
          message: 'Could not resolve DID, make sure it is of the form did:elem:didUniqueSuffix.',
          variant: 'error',
          open: true,
        },
      });
    }
    set({ resolving: false });
  },
  getAll: ({ snackbarMessage, sidetree, set }) => async () => {
    set({ resolving: true });
    try {
      const all = await sidetree.blockchain.getTransactions(config.ELEMENT_START_BLOCK, 'latest');
      const lastTransaction = all.pop();
      await sidetree.sync({
        fromTransactionTime: config.ELEMENT_START_BLOCK,
        toTransactionTime: lastTransaction.transactionTime,
      });
      // sidetree.db.readCollection should only be used in tests. this should be an exposed method.
      const records = await sidetree.db.readCollection('element:sidetree:did:documentRecord');
      const getTransactionTime = record => record.record.lastTransaction.transactionTime;
      records.sort((a, b) => getTransactionTime(b) - getTransactionTime(a));
      set({ documentRecords: records, resolving: false });
    } catch (e) {
      console.error(e);
      snackbarMessage({
        snackbarMessage: {
          message: 'Could not resolve all sidetree documents.',
          variant: 'error',
          open: true,
        },
      });
    }
    set({ resolving: false });
  },
  getSidetreeTransactions: ({ sidetree, set }) => async (args) => {
    set({ loading: true });
    let records = await sidetree.getTransactions(args);
    if (!records.length) {
      const all = await sidetree.blockchain.getTransactions(config.ELEMENT_START_BLOCK, 'latest');
      const lastTransaction = all.pop();
      await sidetree.sync({
        fromTransactionTime: config.ELEMENT_START_BLOCK,
        toTransactionTime: lastTransaction.transactionTime,
      });
      records = await sidetree.getTransactions(args);
    }
    set({ sidetreeTxns: records.reverse(), loading: false });
  },
  getSidetreeOperationsFromTransactionHash: ({
    sidetree,
    set,
  }) => async (transactionHash) => {
    set({ loading: true });
    const summary = await sidetree.getTransactionSummary(transactionHash);
    set({ sidetreeTransactionSummary: summary, loading: false });
  },
});
