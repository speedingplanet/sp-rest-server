/* eslint-disable */
const path = require('path');
const jsonServer = require('json-server');
const chalk = require('chalk');

const apiVersion = 1;
const apiUrl = `/api/v${apiVersion}/banking`;
const port = 8000;
const dataDir = 'data';
const dataFile = 'banking-data.json';
const dataRoutes = path.join(__dirname, dataDir, dataFile);
const resources = Object.keys(require(dataRoutes)).sort();

const server = jsonServer.create();
server.set('view engine', 'pug');
const router = jsonServer.router(dataRoutes);
const middlewares = jsonServer.defaults();
server.get('/', (req, res) => {
  res.render('index', { baseUrl: apiUrl, resources });
});

// TODO: Add urls for discoverability

server.use(middlewares);
server.use(apiUrl, router);
server.listen(port, () => {
  console.log(`Speeding Planet REST server is running`);
  console.log(chalk.underline.bold.green(`\thttp://localhost:${port}/`));
  console.log(chalk.underline.bold.green(`\thttp://0.0.0.0:${port}/`));
});
