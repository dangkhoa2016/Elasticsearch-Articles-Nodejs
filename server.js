const debug = require('debug')('elasticsearch-articles-api-nodejs:server');
const { ElasticsearchService } = require('./src/services');
const { sequelize } = require('./src/models');
const PORT = process.env.PORT || 8080;

sequelize.sync().then(() => {
  const app = require('./src/app');

  app.listen(PORT, async () => {
    await ElasticsearchService.initIndex();
    debug(`App listening at http://localhost:${PORT}`);
  });
});

