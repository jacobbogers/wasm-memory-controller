import fs from 'node:fs';
import { resolve } from 'node:path';

function preBuild() {
    fs.rm(resolve('dist'), { recursive: true }, err => {
        if (err) {
            if (err.code === 'ENOENT') {
                return;
            }
            console.error('there was an error', err);
        }
    })
}


preBuild();