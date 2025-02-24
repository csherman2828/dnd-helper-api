# D&D Helper (Cloud)

This repository defines Amazon Web Services (AWS) using the AWS Cloud
Development Kit (CDK) as Infrastructure as Code (IaC).

## Install

Clone this repository. Once you have it on your machine, enter the directory and
install NPM dependencies:

```bash
git clone git@github.com:csherman2828/dnd-helper-cloud.git
cd dnd-helper-cloud
npm i
```

## Build

To build the project (which will transpile TypeScript), run the following:

```bash
npm run build
```

## Run Server

To run the server as it would function in production, use the following command:

```bash
npm start
```

## Development

To run the server with hot-reload for better developer experience, you can use:

```bash
npm run dev
```

## Run Server with Docker

To build and run a Docker container, you can use the following:

```bash
npm run build:docker
npm run start:docker
```
