'use strict';

const _ = require('lodash');
const app = require('../../../../test/test_broker/support/apps').internal;
const { catalog } = require('@sf/models');
const config = require('@sf/app-config');
const { CONST } = require('@sf/common-utils');


const camelcaseKeys = require('camelcase-keys');
describe('service-broker-api-enhancement', function () {
  describe('get instance endpoint', function () {
      const service_id = '24731fb8-7b84-4f57-914f-c3d55d793dd4';
      const plan_id = '466c5078-df6e-427d-8fb2-c76af50c0f56';
      const organization_guid = 'b8cbbac8-6a20-42bc-b7db-47c205fccf9a';
      const space_guid = 'e7c0a437-7585-4d75-addf-aa4d45b49f3a';
      const instance_id = '951f7a03-df8a-4b75-90be-38abe455568d';
      const protocol = config.external.protocol;
      const host = config.external.host;
      const payload2 = {
        apiVersion: 'osb.servicefabrik.io/v1alpha1',
        kind: 'SFServiceInstance',
        metadata: {
          finalizers: ['broker.servicefabrik.io'],
          name: instance_id,
          labels: {
            'interoperator.servicefabrik.io/lastoperation': 'in_queue',
            state: 'in_queue'
          }
        },
        spec: {
          service_id: service_id,
          plan_id: plan_id,
          context: {
            platform: 'cloudfoundry',
            organization_guid: organization_guid,
            space_guid: space_guid
          },
          organization_guid: organization_guid,
          space_guid: space_guid,
          parameters: {
            foo: 'bar'
          }
        },
        status: {
          state: 'succeeded'
        }
      };

      const payload2K8s = {
        apiVersion: 'osb.servicefabrik.io/v1alpha1',
        kind: 'SFServiceInstance',
        metadata: {
          finalizers: ['broker.servicefabrik.io'],
          name: instance_id,
          labels: {
            state: 'in_queue'
          }
        },
        spec: {
          service_id: service_id,
          plan_id: plan_id,
          context: {
            platform: 'kubernetes',
            namespace: 'default'
          },
          organization_guid: organization_guid,
          space_guid: space_guid,
        },
        status: {
          state: 'succeeded'
        }
      };


    const baseCFUrl = '/cf/v2';
    it('returns 400 (BadRequest) error if service does not support instance retrieval', function () {
      const testPayload2 = _.cloneDeep(payload2);
      testPayload2.spec = camelcaseKeys(payload2.spec);
      mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, testPayload2, 1);
      return chai.request(app)
        .get(`${baseCFUrl}/service_instances/${instance_id}`)
        .set('X-Broker-API-Version', '2.14')
        .auth(config.username, config.password)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

    it('returns 404 if service instance not found', function () {
      const testPayload2 = _.cloneDeep(payload2);
      testPayload2.spec = camelcaseKeys(payload2.spec);
      mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, {}, 1, 404);
      return chai.request(app)
        .get(`${baseCFUrl}/service_instances/${instance_id}`)
        .set('X-Broker-API-Version', '2.14')
        .auth(config.username, config.password)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('returns 404 if status is in_queue', function () {
      //enable service instances somehow
      const oldServices = config.services;
      // config.services = undefined;
      const service = _.find(config.services, ['id', service_id]);
      if(service){
        _.set(service, 'instance_retrievable', true);
        catalog.reload();
      }

      const testPayload2 = _.cloneDeep(payload2);
      testPayload2.status.state = 'in_queue';
      testPayload2.spec = camelcaseKeys(payload2.spec);
      mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, testPayload2, 1);
      return chai.request(app)
        .get(`${baseCFUrl}/service_instances/${instance_id}`)
        .set('X-Broker-API-Version', '2.14')
        .auth(config.username, config.password)
        .catch(err => err.response)
        .then(res => {
          config.services = oldServices;
          catalog.reload();
          expect(res).to.have.status(404);
        });
    });

    it('returns 404 if status is delete', function () {
      //enable service instances somehow
      const oldServices = config.services;
      // config.services = undefined;
      const service = _.find(config.services, ['id', service_id]);
      if(service){
        _.set(service, 'instance_retrievable', true);
        catalog.reload();
      }

      const testPayload2 = _.cloneDeep(payload2);
      testPayload2.status.state = 'delete';
      testPayload2.spec = camelcaseKeys(payload2.spec);
      mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, testPayload2, 1);
      return chai.request(app)
        .get(`${baseCFUrl}/service_instances/${instance_id}`)
        .set('X-Broker-API-Version', '2.14')
        .auth(config.username, config.password)
        .catch(err => err.response)
        .then(res => {
          config.services = oldServices;
          catalog.reload();
          expect(res).to.have.status(404);
        });
    });

    it('returns 404 if status is create in progress', function () {
      //enable service instances somehow
      const oldServices = config.services;
      // config.services = undefined;
      const service = _.find(config.services, ['id', service_id]);
      if(service){
        _.set(service, 'instance_retrievable', true);
        catalog.reload();
      }
      
      const testPayload2 = _.cloneDeep(payload2);
      testPayload2.status.state = 'in progress';
      testPayload2.spec = camelcaseKeys(payload2.spec);
      mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, testPayload2, 1);
      return chai.request(app)
        .get(`${baseCFUrl}/service_instances/${instance_id}`)
        .set('X-Broker-API-Version', '2.14')
        .auth(config.username, config.password)
        .catch(err => err.response)
        .then(res => {
          config.services = oldServices;
          catalog.reload();
          expect(res).to.have.status(404);
        });
    });

    it('returns 422 if status is update in progress', function () {
      //enable service instances somehow
      const oldServices = config.services;
      // config.services = undefined;
      const service = _.find(config.services, ['id', service_id]);
      if(service){
        _.set(service, 'instance_retrievable', true);
        catalog.reload();
      }
      
      const testPayload2 = _.cloneDeep(payload2);
      testPayload2.status.state = 'in progress';
      testPayload2.spec = camelcaseKeys(payload2.spec);
      testPayload2.metadata.labels['interoperator.servicefabrik.io/lastoperation'] = 'update'
      mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, testPayload2, 1);
      return chai.request(app)
        .get(`${baseCFUrl}/service_instances/${instance_id}`)
        .set('X-Broker-API-Version', '2.14')
        .auth(config.username, config.password)
        .catch(err => err.response)
        .then(res => {
          config.services = oldServices;
          catalog.reload();
          expect(res).to.have.status(422);
          expect(res.body.error).to.be.eql('ConcurrencyError');
          expect(res.body.description).to.be.eql('Service Instance updation is in progress and therefore cannot be fetched at this time');
        });
    });

    it('returns 422 if status is update', function () {

      //enable service instances somehow
      const oldServices = config.services;
      // config.services = undefined;
      const service = _.find(config.services, ['id', service_id]);
      if(service){
        _.set(service, 'instance_retrievable', true);
        catalog.reload();
      }

      const testPayload2 = _.cloneDeep(payload2);
      testPayload2.status.state = 'update';
      testPayload2.spec = camelcaseKeys(payload2.spec);
      mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, testPayload2, 1);
      return chai.request(app)
        .get(`${baseCFUrl}/service_instances/${instance_id}`)
        .set('X-Broker-API-Version', '2.14')
        .auth(config.username, config.password)
        .catch(err => err.response)
        .then(res => {
          config.services = oldServices;
          catalog.reload();
          expect(res).to.have.status(422);
          expect(res.body.error).to.deep.equal('ConcurrencyError');
          expect(res.body.description).to.deep.equal('Service Instance is being updated and therefore cannot be fetched at this time');
        });
    });

    it('returns 200 if service instance is successfully returned', function () {
      //enable service instances somehow
      const oldServices = config.services;
      // config.services = undefined;
      const service = _.find(config.services, ['id', service_id]);
      if(service){
        _.set(service, 'instance_retrievable', true);
        catalog.reload();
      }
      const testPayload2 = _.cloneDeep(payload2);
      testPayload2.spec = camelcaseKeys(payload2.spec);
      mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, testPayload2, 1);
      return chai.request(app)
        .get(`${baseCFUrl}/service_instances/${instance_id}`)
        .set('X-Broker-API-Version', '2.14')
        .auth(config.username, config.password)
        .then(res => {
          config.services = oldServices;
          catalog.reload();
          expect(res).to.have.status(200);
          expect(res.body).to.deep.equal({
            service_id: service_id,
            plan_id: plan_id,
            parameters: {
              foo: 'bar'
            },
            dashboard_url: `${protocol}://${host}/manage/dashboards/docker/instances/${instance_id}`
          })
        });
    });

    it('returns 200 if service instance is successfully returned (k8s)', function () {
      //enable service instances somehow
      const oldServices = config.services;
      // config.services = undefined;
      const service = _.find(config.services, ['id', service_id]);
      if(service){
        _.set(service, 'instance_retrievable', true);
        catalog.reload();
      }
      const testPayload2 = _.cloneDeep(payload2K8s);
      testPayload2.spec = camelcaseKeys(payload2K8s.spec);
      mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, testPayload2, 1);
      return chai.request(app)
        .get(`${baseCFUrl}/service_instances/${instance_id}`)
        .set('X-Broker-API-Version', '2.14')
        .auth(config.username, config.password)
        .then(res => {
          config.services = oldServices;
          catalog.reload();
          expect(res).to.have.status(200);
          expect(res.body).to.deep.equal({
            service_id: service_id,
            plan_id: plan_id,
            dashboard_url: `${protocol}://${host}/manage/dashboards/docker/instances/${instance_id}`
          })
        });
    });

    it('returns 412 (PreconditionFailed) error if broker api version is not atleast 2.14', function () {
        const testPayload2 = _.cloneDeep(payload2);
        testPayload2.spec = camelcaseKeys(payload2.spec);
        mocks.apiServerEventMesh.nockGetResource(CONST.APISERVER.RESOURCE_GROUPS.INTEROPERATOR, CONST.APISERVER.RESOURCE_TYPES.INTEROPERATOR_SERVICEINSTANCES, instance_id, testPayload2, 1);
        return chai.request(app)
          .get(`${baseCFUrl}/service_instances/${instance_id}`)
          .set('X-Broker-API-Version', '2.12')
          .auth(config.username, config.password)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(412);
          });
    });

  });

});