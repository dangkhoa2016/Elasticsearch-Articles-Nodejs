const { elasticsearch: { client, indexName } } = require('../libs');
// const indexSettings = require('../config/index.json');
const indexSettings = require('../config/index.v5.json');
const debug = require('debug')('elasticsearch-articles-api-nodejs:Services->elasticsearch');

class ElasticsearchService {
  constructor(es_client) {
    this.client = es_client || client;
  }

  /**
  * Delete an existing index
  */
  deleteIndex(index_name = '') {
    if (!index_name)
      index_name = indexName;
    return this.client.indices.delete({
      index: index_name
    }).then(res => {
      const { body: { acknowledged = false } = {} } = res || {};
      return acknowledged;
    }).catch((ex) => (false));
  }

  /**
  * create the index
  */
  async initIndex(index_name = '') {
    if (!index_name)
      index_name = indexName;
    var existed = await this.indexExists(index_name);
    if (existed)
      return true;

    try {
      const { body: { acknowledged = false } = {} } = await this.client.indices.create({
        index: index_name,
        body: indexSettings
      });
      return acknowledged;
    } catch (ex) {
      console.log(ex);
      return false;
    };
  }

  /**
  * check if the index exists
  */
  indexExists(index_name = '') {
    if (!index_name)
      index_name = indexName;
    return this.client.indices.exists({
      index: index_name
    }).then(res => {
      var { body = false } = res || {};
      return body;
    }).catch(() => (false));
  }

  indexDocument(id, document, index_name = '') {
    if (typeof id === 'object') {
      debug('Invalid id got', id);
      return;
    }

    if (!index_name)
      index_name = indexName;

    if (!id && document.id)
      id = document.id;
    // delete document.id;
    delete document['articles_categories'];
    delete document['authorships'];

    debug(`Index document: ${id}`);

    return this.client.index({
      index: index_name,
      id,
      body: document
    }).then(res => {
      var { body } = res || {};
      // debug('index result', body);
      return body;
    }).catch((ex) => {
      debug('Error index document', ex);
    });
  };

  bulkIndexDocument(documents, index_name = '') {
    if (!index_name)
      index_name = indexName;

    debug(`Index documents: ${documents.length}`);
    documents = documents.flatMap(doc => {
      delete doc['articles_categories'];
      delete doc['authorships'];

      // v7
      return [{ index: { _index: index_name, _id: doc.id, } }, doc];
      // v6
      // return [{ index: { _index: index_name, _id: doc.id, _type: '_doc' } }, doc];
      // v5
      // return [{ index: { _index: index_name, _id: doc.id, _type: 'articles' } }, doc];
    });

    return this.client.bulk({
      index: index_name,
      body: documents
    }).then(res => {
      var { body } = res || {};
      debug('index result', body);
      return body;
    }).catch((ex) => {
      debug('Error index documents', ex);
    });
  };

  removeIndexDocument(id, index_name = '') {
    debug(`Remove document: ${id}`);

    if (!index_name)
      index_name = indexName;
    return this.client.delete({
      index: index_name,
      id,
    }).then(res => {
      var { body } = res || {};
      debug('remove document result', body)
      return body;
    }).catch((ex) => {
      debug('Error remove document', ex);
    });
  }
};

module.exports = new ElasticsearchService();
