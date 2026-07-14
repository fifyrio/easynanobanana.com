'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_API_URL = 'https://www.easynanobanana.com';
const CONFIG_DIR = path.join(os.homedir(), '.easynanobanana');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

/** Load persisted config, layered under env overrides. */
function loadConfig() {
  let file = {};
  try {
    file = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    // no config yet
  }
  return {
    apiKey: process.env.EASYNANOBANANA_API_KEY || file.apiKey || null,
    apiUrl: process.env.EASYNANOBANANA_API_URL || file.apiUrl || DEFAULT_API_URL,
  };
}

/** Persist config (0600 so the API key is not world-readable). */
function saveConfig(patch) {
  let current = {};
  try {
    current = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    // fresh
  }
  const next = { ...current, ...patch };
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), { mode: 0o600 });
  return next;
}

module.exports = { loadConfig, saveConfig, CONFIG_PATH, DEFAULT_API_URL };
