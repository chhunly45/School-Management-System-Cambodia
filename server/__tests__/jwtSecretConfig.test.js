const { strict: assert } = require('node:assert');
const { randomBytes } = require('node:crypto');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { describe, it } = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..', '..');

const runConfigCheck = ({ nodeEnv, jwtSecret }) => {
  const env = { ...process.env, NODE_ENV: nodeEnv, MONGODB_URI: 'mongodb://localhost/test' };
  if (jwtSecret === undefined) {
    delete env.JWT_SECRET;
  } else {
    env.JWT_SECRET = jwtSecret;
  }

  return spawnSync(process.execPath, [
    '-e',
    `
      const config = require('./server/config');
      if (process.env.CHECK_CONFIG_SECRET === 'configured') {
        config.validateEnvironment();
        if (config.jwtSecret !== process.env.JWT_SECRET) process.exit(2);
        console.log('CONFIG_VALID');
      } else if (process.env.CHECK_CONFIG_SECRET === 'missing') {
        try {
          config.validateEnvironment();
          process.exit(2);
        } catch (error) {
          if (!error.message.includes('JWT_SECRET')) process.exit(3);
          console.log('MISSING_SECRET_REJECTED');
        }
      } else {
        if (config.jwtSecret !== '') process.exit(2);
        console.log('NO_FALLBACK');
      }
    `
  ], {
    cwd: repositoryRoot,
    env: { ...env, CHECK_CONFIG_SECRET: jwtSecret === undefined ? (nodeEnv === 'production' ? 'missing' : 'empty') : 'configured' },
    encoding: 'utf8'
  });
};

describe('JWT secret configuration', () => {
  it('does not use a hard-coded JWT secret when configuration is missing', () => {
    const result = runConfigCheck({ nodeEnv: 'development' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /NO_FALLBACK/);
  });

  it('uses a configured JWT_SECRET in production', () => {
    const jwtSecret = randomBytes(32).toString('hex');
    const result = runConfigCheck({ nodeEnv: 'production', jwtSecret });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /CONFIG_VALID/);
  });

  it('fails production validation when JWT_SECRET is missing', () => {
    const result = runConfigCheck({ nodeEnv: 'production' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /MISSING_SECRET_REJECTED/);
  });
});
