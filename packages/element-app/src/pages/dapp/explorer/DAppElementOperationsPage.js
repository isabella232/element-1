import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';

import { compose } from 'recompose';

import { Typography, Grid, LinearProgress } from '@material-ui/core';

import { Pages } from '../../../components/index';

import ligthNode from '../../../redux/lightNode';

import { Ledger } from '../../../components/Ledger';
import { Storage } from '../../../components/Storage';
import { SidetreeOperation } from '../../../components/SidetreeOperation';

import { getSidetree } from '../../../services/sidetree';

class DAppElementOperationsPage extends Component {
  async componentWillMount() {
    await getSidetree();
    if (this.props.match.params.uid) {
      this.props.getOperationsForUID(this.props.match.params.uid);
    } else {
      this.props.getOperationsForUID();
    }
  }

  render() {
    const { lightNode } = this.props;
    const { sidetreeOperations, loading } = lightNode;
    return (
      <Pages.WithNavigation>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Typography variant="h3" style={{ marginBottom: '8px' }}>
              Element Operations
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Ledger
              operationCount={sidetreeOperations ? sidetreeOperations.length : 'loading...'}
            />
          </Grid>

          <Grid item xs={12}>
            <Storage />
          </Grid>

          {!sidetreeOperations || loading ? (
            <Grid item xs={12}>
              <LinearProgress color="primary" variant="query" />
            </Grid>
          ) : (
            <React.Fragment>
              {sidetreeOperations.map(op => (
                <Grid item xs={12} key={op.operationHash}>
                  <SidetreeOperation operation={op} expanded={false} />
                </Grid>
              ))}
            </React.Fragment>
          )}
        </Grid>
      </Pages.WithNavigation>
    );
  }
}

DAppElementOperationsPage.propTypes = {
  lightNode: PropTypes.object.isRequired,
  getOperationsForUID: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
};

const ConnectedDAppElementOperationsPage = compose(
  withRouter,
  ligthNode.container,
)(DAppElementOperationsPage);

export { ConnectedDAppElementOperationsPage as DAppElementOperationsPage };

export default ConnectedDAppElementOperationsPage;