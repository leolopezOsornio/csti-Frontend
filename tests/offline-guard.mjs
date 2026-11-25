import net from 'node:net';
import { after } from 'node:test';
import assert from 'node:assert/strict';
let attempts = 0;
const deny = () => { attempts++; throw Error('External network is disabled in checkout regression tests'); };
net.Socket.prototype.connect = deny;
globalThis.fetch = async () => deny();
after(() => assert.equal(attempts, 0, 'No real network may be attempted, even if the application catches the error'));
