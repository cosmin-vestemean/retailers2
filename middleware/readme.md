# edi-integration-middleware

> aplicație web multi-tenant (PaaS - deși inițial implementată pentru un singur client, Pet Factory) care servește ca platformă de integrare între diverși provideri EDI (Electronic Data Interchange) și sistemul ERP Soft1 (S1). Aplicația va facilita schimbul bidirecțional de documente electronice (XML) între retaileri (via provideri EDI) și ERP-ul S1. Aplicația va rula pe Heroku.

## About

This project uses [Feathers](http://feathersjs.com). An open source framework for building APIs and real-time applications.

## Getting Started

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Install your dependencies

    ```
    cd path/to/edi-integration-middleware
    npm install
    ```

3. Start your app

    ```
    npm run migrate # Run migrations to set up the database
    npm start
    ```

## Testing

Run `npm test` and all your tests in the `test/` directory will be run.

## Scaffolding

This app comes with a powerful command line interface for Feathers. Here are a few things it can do:

```
$ npx feathers help                           # Show all commands
$ npx feathers generate service               # Generate a new Service
```

## Help

For more information on all the things you can do with Feathers visit [docs.feathersjs.com](http://docs.feathersjs.com).
