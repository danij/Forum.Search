#!/usr/bin/env node
'use strict';

const process = require('process');
const fs = require('fs');
const path = require('path');
const pg = require('pg');

function getIdFromFileName(fileName) {

    const regex = /.*-(\d+).json/;
    const match = regex.exec(fileName);
    return match ? parseInt(match[1]) : 0;
}

function compareFileNamesById(first, second) {

    return Math.sign(getIdFromFileName(first) - getIdFromFileName(second));
}

const importFunctions = {
    'new thread': importNewThread,
    'change thread name': importChangeThreadName,
    'delete thread': importDeleteThread,
    'new thread message': importNewThreadMessage,
    'change thread message content': importChangeThreadMessageContent,
    'delete thread message': importDeleteMessageThread
};

function connect() {

    return new Promise((resolve, reject) => {

        const pool = new pg.Pool();
        pool.connect((err, client, done) => {

            if (err) {

                reject(err);
            }
            resolve(client);
        });
    });
}

function executeQuery(client, text, parameters) {

    parameters = parameters || [];

    return new Promise((resolve, reject) => {

        client.query(text, parameters, (err, res) => {

            if (err) {

                reject(err);
            }
            else {

                resolve(res);
            }
        });
    });
}

async function importFile(client, filePath) {

    const entries = JSON.parse(fs.readFileSync(filePath));

    await executeQuery(client, 'BEGIN;');

    for (const entry of entries) {

        const importFunction = importFunctions[entry.type];
        if (importFunction) {

            const result = importFunction(entry);

            await executeQuery(client, result[0], result.length > 1 ? result[1] : []);
        }
        else {
            throw new Error('Cannot import data of type: ' + entry.type);
        }
    }

    await executeQuery(client, 'COMMIT;');
}

function importNewThread(entry) {

    return [
        'INSERT INTO "threads" ("id", "name") VALUES ($1, to_tsvector($2));',
        [entry.id, entry.name]
    ];
}

function importChangeThreadName(entry) {

    return [
        'UPDATE "threads" SET "name" = to_tsvector($2) WHERE "id" = $1;',
        [entry.id, entry.name]
    ];
}

function importDeleteThread(entry) {

    return [
        'DELETE FROM "threads" WHERE "id" = $1;',
        [entry.id]
    ];
}

function importNewThreadMessage(entry) {

    return [
        'INSERT INTO "thread_messages" ("id", "content") VALUES ($1, to_tsvector($2));',
        [entry.id, entry.content]
    ];
}

function importChangeThreadMessageContent(entry) {

    return [
        'UPDATE "thread_messages" SET "content" = to_tsvector($2) WHERE "id" = $1;',
        [entry.id, entry.content]
    ];
}

function importDeleteMessageThread(entry) {

    return [
        'DELETE FROM "thread_messages" WHERE "id" = $1;',
        [entry.id]
    ];
}

async function main() {

    const importFolder = process.argv.slice(-1)[0];

    const filePaths =
        fs
            .readdirSync(importFolder)
            .sort(compareFileNamesById)
            .map(f => path.join(importFolder, f));

    const client = await connect();

    for (const filePath of filePaths) {

        await importFile(client, filePath);
    }
    process.exit();
}

main();
