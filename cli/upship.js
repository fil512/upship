#!/usr/bin/env node

/**
 * UP SHIP! Command-Line Client
 *
 * A CLI tool for playing UP SHIP! via the REST API.
 * Supports multiple simultaneous user sessions.
 *
 * Usage:
 *   upship login <username> <password>     - Login and store session
 *   upship <username> <command> [args...]  - Run command as user
 *
 * Examples:
 *   upship login testpilot42 airship123
 *   upship testpilot42 games
 *   upship testpilot42 create "My Game"
 *   upship testpilot42 join <gameId>
 *   upship testpilot42 state <gameId>
 *   upship testpilot42 action <gameId> END_TURN
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const DEFAULT_BASE_URL = process.env.UPSHIP_URL || 'https://upship-production.up.railway.app';
const SESSION_DIR = path.join(process.cwd(), '.upship-sessions');

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Session management
function getSessionPath(username) {
  return path.join(SESSION_DIR, `${username}.json`);
}

function loadSession(username) {
  const sessionPath = getSessionPath(username);
  if (fs.existsSync(sessionPath)) {
    return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  }
  return null;
}

function saveSession(username, sessionData) {
  const sessionPath = getSessionPath(username);
  fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
}

function deleteSession(username) {
  const sessionPath = getSessionPath(username);
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
  }
}

function listSessions() {
  if (!fs.existsSync(SESSION_DIR)) return [];
  return fs.readdirSync(SESSION_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

// HTTP client
function makeRequest(method, urlPath, body, cookie) {
  return new Promise((resolve, reject) => {
    const baseUrl = new URL(DEFAULT_BASE_URL);
    const isHttps = baseUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: baseUrl.hostname,
      port: baseUrl.port || (isHttps ? 443 : 80),
      path: urlPath,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = lib.request(options, (res) => {
      let data = '';

      res.on('data', chunk => { data += chunk; });

      res.on('end', () => {
        // Extract session cookie from response
        const setCookie = res.headers['set-cookie'];
        let sessionCookie = null;
        if (setCookie) {
          for (const c of setCookie) {
            if (c.startsWith('connect.sid=')) {
              sessionCookie = c.split(';')[0];
              break;
            }
          }
        }

        let parsed;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch (e) {
          parsed = { rawResponse: data };
        }

        resolve({
          status: res.statusCode,
          data: parsed,
          cookie: sessionCookie
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// API wrapper with session handling
async function api(username, method, path, body = null) {
  const session = loadSession(username);
  const cookie = session?.cookie;

  const response = await makeRequest(method, path, body, cookie);

  // Update session cookie if we got a new one
  if (response.cookie && session) {
    session.cookie = response.cookie;
    saveSession(username, session);
  }

  return response;
}

// Formatting helpers
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

const FACTION_COLORS = {
  germany: COLORS.yellow,
  britain: COLORS.blue,
  usa: COLORS.cyan,
  italy: COLORS.green
};

function c(color, text) {
  return `${color}${text}${COLORS.reset}`;
}

function formatCash(amount) {
  return c(COLORS.green, `£${amount}`);
}

function formatFaction(faction) {
  const color = FACTION_COLORS[faction] || COLORS.white;
  return c(color, faction?.toUpperCase() || 'NONE');
}

function formatPhase(phase) {
  const phaseColors = {
    planning: COLORS.blue,
    actions: COLORS.yellow,
    launch: COLORS.magenta,
    income: COLORS.green,
    cleanup: COLORS.gray
  };
  return c(phaseColors[phase] || COLORS.white, phase?.toUpperCase() || 'UNKNOWN');
}

// Command implementations
const commands = {
  // Authentication
  async login(args) {
    const [username, password] = args;
    if (!username || !password) {
      console.log('Usage: upship login <username> <password>');
      return;
    }

    const response = await makeRequest('POST', '/api/auth/login', { username, password });

    if (response.status === 200 && response.data.user) {
      saveSession(username, {
        userId: response.data.user.id,
        username: response.data.user.username,
        cookie: response.cookie
      });
      console.log(c(COLORS.green, `✓ Logged in as ${username}`));
      console.log(`  User ID: ${response.data.user.id}`);
    } else {
      console.log(c(COLORS.red, `✗ Login failed: ${response.data.error || 'Unknown error'}`));
    }
  },

  async register(args) {
    const [username, password] = args;
    if (!username || !password) {
      console.log('Usage: upship register <username> <password>');
      return;
    }

    const response = await makeRequest('POST', '/api/auth/register', { username, password });

    if (response.status === 200 && response.data.user) {
      saveSession(username, {
        userId: response.data.user.id,
        username: response.data.user.username,
        cookie: response.cookie
      });
      console.log(c(COLORS.green, `✓ Registered and logged in as ${username}`));
    } else {
      console.log(c(COLORS.red, `✗ Registration failed: ${response.data.error || 'Unknown error'}`));
    }
  },

  async logout(username) {
    await api(username, 'POST', '/api/auth/logout');
    deleteSession(username);
    console.log(c(COLORS.green, `✓ Logged out ${username}`));
  },

  async whoami(username) {
    const response = await api(username, 'GET', '/api/auth/me');
    if (response.data.user) {
      console.log(`Logged in as: ${c(COLORS.bright, response.data.user.username)}`);
      console.log(`User ID: ${response.data.user.id}`);
    } else {
      console.log(c(COLORS.red, 'Not logged in or session expired'));
    }
  },

  async sessions() {
    const sessions = listSessions();
    if (sessions.length === 0) {
      console.log('No active sessions. Use: upship login <username> <password>');
      return;
    }
    console.log(c(COLORS.bright, 'Active sessions:'));
    for (const username of sessions) {
      const session = loadSession(username);
      console.log(`  ${c(COLORS.cyan, username)} (${session.userId})`);
    }
  },

  // Game lobby
  async games(username, args) {
    const status = args[0] || 'all';
    let response;

    if (status === 'mine') {
      response = await api(username, 'GET', '/api/games/mine');
    } else if (status === 'all') {
      // Get both waiting and active games
      const waiting = await api(username, 'GET', '/api/games?status=waiting');
      const active = await api(username, 'GET', '/api/games?status=active');
      response = {
        data: {
          games: [...(waiting.data.games || []), ...(active.data.games || [])]
        }
      };
    } else {
      response = await api(username, 'GET', `/api/games?status=${status}`);
    }

    const games = response.data.games || [];

    if (games.length === 0) {
      console.log('No games found.');
      return;
    }

    console.log(c(COLORS.bright, `Games (${games.length}):`));
    console.log('─'.repeat(70));

    for (const game of games) {
      const statusColor = game.status === 'waiting' ? COLORS.yellow :
                         game.status === 'active' ? COLORS.green : COLORS.gray;
      console.log(`${c(COLORS.cyan, game.id.slice(0, 8))} │ ${game.name.padEnd(30)} │ ${c(statusColor, game.status.padEnd(8))} │ ${game.player_count || 0}/4 players`);
    }
  },

  async create(username, args) {
    const name = args.join(' ') || `Game ${Date.now()}`;
    const response = await api(username, 'POST', '/api/games', { name });

    if (response.status === 201 && response.data.game) {
      console.log(c(COLORS.green, `✓ Created game: ${response.data.game.name}`));
      console.log(`  Game ID: ${c(COLORS.cyan, response.data.game.id)}`);
    } else {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
    }
  },

  async join(username, args) {
    const [gameId] = args;
    if (!gameId) {
      console.log('Usage: upship <user> join <gameId>');
      return;
    }

    const response = await api(username, 'POST', `/api/games/${gameId}/join`);

    if (response.data.game) {
      console.log(c(COLORS.green, `✓ Joined game: ${response.data.game.name}`));
    } else {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
    }
  },

  async leave(username, args) {
    const [gameId] = args;
    if (!gameId) {
      console.log('Usage: upship <user> leave <gameId>');
      return;
    }

    const response = await api(username, 'POST', `/api/games/${gameId}/leave`);

    if (response.data.game) {
      console.log(c(COLORS.green, '✓ Left game'));
    } else {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
    }
  },

  async faction(username, args) {
    const [gameId, faction] = args;
    if (!gameId || !faction) {
      console.log('Usage: upship <user> faction <gameId> <germany|britain|usa|italy>');
      return;
    }

    const response = await api(username, 'POST', `/api/games/${gameId}/faction`, { faction });

    if (response.data.game) {
      console.log(c(COLORS.green, `✓ Selected faction: ${formatFaction(faction)}`));
    } else {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
    }
  },

  async start(username, args) {
    const [gameId] = args;
    if (!gameId) {
      console.log('Usage: upship <user> start <gameId>');
      return;
    }

    const response = await api(username, 'POST', `/api/games/${gameId}/start`);

    if (response.data.game) {
      console.log(c(COLORS.green, '✓ Game started!'));
    } else {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
    }
  },

  // Game state
  async state(username, args) {
    const [gameId] = args;
    if (!gameId) {
      console.log('Usage: upship <user> state <gameId>');
      return;
    }

    const session = loadSession(username);
    const response = await api(username, 'GET', `/api/state/${gameId}`);

    if (response.status !== 200) {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
      return;
    }

    const gs = response.data.gameState.state;
    const myId = session.userId;
    const myState = gs.players?.[myId];
    const currentPlayerId = gs.playerOrder?.[gs.currentPlayerIndex];
    const isMyTurn = currentPlayerId === myId;

    // Header
    console.log('');
    console.log(c(COLORS.bright, '═══════════════════════════════════════════════════════════════════════'));
    console.log(c(COLORS.bright, `  UP SHIP! - Age ${gs.age} │ Turn ${gs.turn} │ Round ${gs.round} │ Phase: ${formatPhase(gs.phase)}`));
    console.log(c(COLORS.bright, '═══════════════════════════════════════════════════════════════════════'));

    // Turn indicator
    if (isMyTurn) {
      console.log(c(COLORS.green + COLORS.bright, '  >>> YOUR TURN <<<'));
    } else {
      const currentPlayer = gs.players?.[currentPlayerId];
      console.log(c(COLORS.yellow, `  Waiting for: ${formatFaction(currentPlayer?.faction)}`));
    }
    console.log('');

    // My resources
    if (myState) {
      console.log(c(COLORS.bright, '┌─ Your Status (' + formatFaction(myState.faction) + ')'));
      console.log(`│ Cash: ${formatCash(myState.cash)}  │  Income: ${c(COLORS.cyan, myState.income + '/turn')}`);
      console.log(`│ Pilots: ${c(COLORS.magenta, myState.pilots)}  │  Engineers: ${c(COLORS.yellow, myState.engineers)}`);
      console.log(`│ Gas: ${c(COLORS.cyan, 'H₂:' + (myState.gasCubes?.hydrogen || 0))} ${c(COLORS.green, 'He:' + (myState.gasCubes?.helium || 0))}`);
      console.log(`│ Hand: ${myState.hand?.length || 0} cards  │  Deck: ${myState.deck?.length || 0}  │  Discard: ${myState.discardPile?.length || 0}`);
      console.log(`│ Ships: ${(myState.ships || []).length} (Hangar: ${(myState.ships || []).filter(s => s.status === 'hangar').length})`);
      console.log(`│ Technologies: ${(myState.technologies || []).length}`);
      console.log('└─────────────────────────────────────');

      // Show hand if present
      if (myState.hand?.length > 0) {
        console.log('');
        console.log(c(COLORS.bright, '┌─ Your Hand'));
        myState.hand.forEach((card, i) => {
          console.log(`│ [${i}] ${card.name} (${card.symbol || '?'})`);
        });
        console.log('└─────────────────────────────────────');
      }

      // Show ships with IDs
      if ((myState.ships || []).length > 0) {
        console.log('');
        console.log(c(COLORS.bright, '┌─ Your Ships'));
        for (const ship of myState.ships) {
          const statusColor = ship.status === 'hangar' ? COLORS.yellow : ship.status === 'launched' ? COLORS.green : COLORS.red;
          let shipInfo = `│ ${c(COLORS.cyan, ship.id)} │ ${c(statusColor, ship.status.toUpperCase())}`;
          if (ship.stats) {
            shipInfo += ` │ Range:${ship.stats.range} Speed:${ship.stats.speed}`;
          }
          if (ship.route) {
            shipInfo += ` │ Route: ${ship.route}`;
          }
          console.log(shipInfo);
        }
        console.log('└─────────────────────────────────────');
      }
    }

    // Other players
    console.log('');
    console.log(c(COLORS.bright, '┌─ Opponents'));
    for (const [pid, pState] of Object.entries(gs.players || {})) {
      if (pid === myId) continue;
      const isCurrent = pid === currentPlayerId;
      const marker = isCurrent ? c(COLORS.yellow, '►') : ' ';
      console.log(`│${marker} ${formatFaction(pState.faction)}: ${formatCash(pState.cash)} │ Income ${pState.income} │ Ships ${(pState.ships || []).length}`);
    }
    console.log('└─────────────────────────────────────');

    // Gas Market
    console.log('');
    console.log(c(COLORS.bright, '┌─ Gas Market'));
    console.log(`│ Hydrogen: ${c(COLORS.cyan, '£' + (gs.gasMarket?.hydrogen || 2) + '/cube')}`);
    console.log(`│ Helium:   ${c(COLORS.green, '£' + (gs.gasMarket?.helium || 3) + '/cube')}`);
    console.log('└─────────────────────────────────────');

    // R&D Board (available technologies)
    if ((gs.rdBoard || []).length > 0) {
      console.log('');
      console.log(c(COLORS.bright, '┌─ R&D Board (Available Technologies)'));
      for (const tech of gs.rdBoard) {
        const owned = myState?.technologies?.includes(tech.id) ? c(COLORS.green, ' [OWNED]') : '';
        console.log(`│ ${c(COLORS.cyan, tech.id.padEnd(22))} │ £${tech.cost || 0}${owned}`);
      }
      console.log('└─────────────────────────────────────');
    }

    // Recent log
    const recentLogs = (gs.log || []).slice(-5);
    if (recentLogs.length > 0) {
      console.log('');
      console.log(c(COLORS.bright, '┌─ Recent Activity'));
      for (const log of recentLogs) {
        const time = new Date(log.timestamp).toLocaleTimeString();
        console.log(`│ ${c(COLORS.gray, time)} ${log.message}`);
      }
      console.log('└─────────────────────────────────────');
    }

    console.log('');
  },

  async blueprint(username, args) {
    const [gameId] = args;
    if (!gameId) {
      console.log('Usage: upship <user> blueprint <gameId>');
      return;
    }

    const session = loadSession(username);
    const response = await api(username, 'GET', `/api/state/${gameId}`);

    if (response.status !== 200) {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
      return;
    }

    const gs = response.data.gameState.state;
    const myState = gs.players?.[session.userId];

    if (!myState) {
      console.log(c(COLORS.red, 'Player state not found'));
      return;
    }

    const bp = myState.blueprint;

    console.log('');
    console.log(c(COLORS.bright, '═══════════════════════════════════════════════════════════════'));
    console.log(c(COLORS.bright, '                         YOUR BLUEPRINT'));
    console.log(c(COLORS.bright, '═══════════════════════════════════════════════════════════════'));

    const slotTypes = [
      { key: 'frameSlots', name: 'Frame', color: COLORS.red },
      { key: 'fabricSlots', name: 'Fabric', color: COLORS.blue },
      { key: 'driveSlots', name: 'Drive', color: COLORS.yellow },
      { key: 'componentSlots', name: 'Component', color: COLORS.magenta }
    ];

    for (const { key, name, color } of slotTypes) {
      const slots = bp[key] || [];
      console.log('');
      console.log(c(color + COLORS.bright, `┌─ ${name} Slots (${slots.filter(s => s).length}/${slots.length})`));
      slots.forEach((upgrade, i) => {
        const status = upgrade ? c(COLORS.green, upgrade) : c(COLORS.gray, 'empty');
        console.log(`│ [${i}] ${status}`);
      });
      console.log(c(color, '└─────────────────────────────────────'));
    }

    // Gas sockets
    const gasSockets = bp.gasSockets || [];
    console.log('');
    console.log(c(COLORS.cyan + COLORS.bright, `┌─ Gas Sockets (${gasSockets.filter(s => s).length}/${gasSockets.length})`));
    gasSockets.forEach((gas, i) => {
      const gasColor = gas === 'hydrogen' ? COLORS.cyan : gas === 'helium' ? COLORS.green : COLORS.gray;
      const status = gas ? c(gasColor, gas) : c(COLORS.gray, 'empty');
      console.log(`│ [${i}] ${status}`);
    });
    console.log(c(COLORS.cyan, '└─────────────────────────────────────'));

    console.log('');
  },

  async upgrades(username, args) {
    const [gameId] = args;
    if (!gameId) {
      console.log('Usage: upship <user> upgrades <gameId>');
      return;
    }

    const response = await api(username, 'GET', `/api/state/${gameId}/upgrades`);

    if (response.status !== 200) {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
      return;
    }

    const { available, allUpgrades } = response.data;

    console.log('');
    console.log(c(COLORS.bright, 'Available Upgrades (based on your technologies):'));
    console.log('─'.repeat(60));

    // available is an object with slot types as keys
    const slotTypes = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];
    let totalCount = 0;

    for (const slotType of slotTypes) {
      const upgrades = available[slotType] || [];
      if (upgrades.length === 0) continue;

      totalCount += upgrades.length;
      const slotName = slotType.replace('Slots', '').toUpperCase();
      console.log(c(COLORS.yellow, `\n${slotName}:`));

      for (const upgrade of upgrades) {
        const weightStr = upgrade.weight ? `Weight: ${upgrade.weight}` : '';
        console.log(`  ${c(COLORS.cyan, upgrade.id.padEnd(22))} │ Age ${upgrade.age} │ ${weightStr}`);
        if (upgrade.stats) {
          const statStr = Object.entries(upgrade.stats)
            .map(([k, v]) => `${k}:${v > 0 ? '+' : ''}${v}`)
            .join(' ');
          console.log(`  ${''.padEnd(22)} │ ${c(COLORS.green, statStr)}`);
        }
      }
    }

    if (totalCount === 0) {
      console.log(c(COLORS.gray, 'No upgrades available. Acquire technologies first.'));
    }
    console.log('');
  },

  async log(username, args) {
    const [gameId, limitStr] = args;
    if (!gameId) {
      console.log('Usage: upship <user> log <gameId> [limit]');
      return;
    }

    const limit = parseInt(limitStr) || 20;
    const response = await api(username, 'GET', `/api/state/${gameId}/actions?limit=${limit}`);

    if (response.status !== 200) {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
      return;
    }

    const actions = response.data.actions || [];

    console.log('');
    console.log(c(COLORS.bright, `Game Log (last ${actions.length} actions):`));
    console.log('─'.repeat(70));

    for (const action of actions) {
      const time = new Date(action.created_at).toLocaleTimeString();
      console.log(`${c(COLORS.gray, time)} │ ${action.action_type} │ ${JSON.stringify(action.action_data || {})}`);
    }
    console.log('');
  },

  // Game actions
  async action(username, args) {
    const [gameId, actionType, ...rest] = args;
    if (!gameId || !actionType) {
      console.log('Usage: upship <user> action <gameId> <ACTION_TYPE> [key=value ...]');
      console.log('');
      console.log('Actions:');
      console.log('  END_TURN                    - End your turn');
      console.log('  BUY_GAS type=hydrogen amt=2 - Buy gas cubes');
      console.log('  TAKE_LOAN                   - Take a £30 loan');
      console.log('  COLLECT_INCOME              - Collect your income');
      console.log('  DRAW_CARDS count=2          - Draw cards');
      console.log('  PLAY_CARD idx=0             - Play card from hand');
      console.log('  RECRUIT_CREW type=pilot n=1 - Recruit crew');
      console.log('  BUILD_SHIP count=1          - Build ships');
      console.log('  LAUNCH_SHIP shipId=<id> gasType=hydrogen - Launch a ship (spends gas from reserve)');
      console.log('  ACQUIRE_TECHNOLOGY tech=<id> - Buy tech from R&D board');
      console.log('  INSTALL_UPGRADE slot=frame i=0 id=<upgradeId>');
      console.log('  REMOVE_UPGRADE slot=frame i=0');
      return;
    }

    // Parse key=value pairs into actionData
    const actionData = {};
    for (const arg of rest) {
      const [key, value] = arg.split('=');
      if (key && value !== undefined) {
        // Try to parse as number or boolean
        if (value === 'true') actionData[key] = true;
        else if (value === 'false') actionData[key] = false;
        else if (!isNaN(value)) actionData[key] = parseInt(value);
        else actionData[key] = value;
      }
    }

    // Map shorthand keys to API expected keys
    const keyMap = {
      type: 'gasType',
      amt: 'amount',
      idx: 'cardIndex',
      i: 'slotIndex',
      n: 'count',
      id: 'upgradeId',
      tech: 'techId',
      slot: 'slotType',
      ship: 'shipId'
    };

    for (const [short, long] of Object.entries(keyMap)) {
      if (actionData[short] !== undefined && actionData[long] === undefined) {
        actionData[long] = actionData[short];
        delete actionData[short];
      }
    }

    const response = await api(username, 'POST', `/api/state/${gameId}/action`, {
      actionType,
      actionData
    });

    if (response.data.success) {
      console.log(c(COLORS.green, `✓ ${actionType} executed successfully`));

      // Show latest log entry
      const logs = response.data.gameState?.state?.log || [];
      if (logs.length > 0) {
        const latest = logs[logs.length - 1];
        console.log(`  ${c(COLORS.gray, latest.message)}`);
      }
    } else {
      console.log(c(COLORS.red, `✗ Failed: ${response.data.error || 'Unknown error'}`));
    }
  },

  // Shorthand actions
  async endturn(username, args) {
    return commands.action(username, [args[0], 'END_TURN']);
  },

  async buygas(username, args) {
    const [gameId, gasType, amount] = args;
    if (!gameId || !gasType) {
      console.log('Usage: upship <user> buygas <gameId> <hydrogen|helium> [amount]');
      return;
    }
    return commands.action(username, [gameId, 'BUY_GAS', `gasType=${gasType}`, `amount=${amount || 1}`]);
  },

  async loan(username, args) {
    return commands.action(username, [args[0], 'TAKE_LOAN']);
  },

  async draw(username, args) {
    const [gameId, count] = args;
    return commands.action(username, [gameId, 'DRAW_CARDS', `count=${count || 1}`]);
  },

  async build(username, args) {
    const [gameId, count] = args;
    return commands.action(username, [gameId, 'BUILD_SHIP', `count=${count || 1}`]);
  },

  async recruit(username, args) {
    const [gameId, crewType, count] = args;
    if (!gameId || !crewType) {
      console.log('Usage: upship <user> recruit <gameId> <pilot|engineer> [count]');
      return;
    }
    return commands.action(username, [gameId, 'RECRUIT_CREW', `crewType=${crewType}`, `count=${count || 1}`]);
  },

  async load(username, args) {
    console.log(`${COLORS.yellow}Note: Gas loading is no longer needed.${COLORS.reset}`);
    console.log('Gas cubes are automatically spent from your reserve when you launch.');
    console.log('Use: upship <user> launch <gameId> <shipId> [hydrogen|helium]');
    return;
  },

  async launch(username, args) {
    const [gameId, shipId, gasType = 'hydrogen'] = args;
    if (!gameId || !shipId) {
      console.log('Usage: upship <user> launch <gameId> <shipId> [hydrogen|helium]');
      console.log('  Gas type defaults to hydrogen if not specified.');
      return;
    }
    return commands.action(username, [gameId, 'LAUNCH_SHIP', `shipId=${shipId}`, `gasType=${gasType}`]);
  },

  async tech(username, args) {
    const [gameId, techId] = args;
    if (!gameId || !techId) {
      console.log('Usage: upship <user> tech <gameId> <techId>');
      return;
    }
    return commands.action(username, [gameId, 'ACQUIRE_TECHNOLOGY', `tech=${techId}`]);
  },

  async install(username, args) {
    const [gameId, slotType, slotIndex, upgradeId] = args;
    if (!gameId || !slotType || slotIndex === undefined || !upgradeId) {
      console.log('Usage: upship <user> install <gameId> <frame|fabric|drive|component> <slotIndex> <upgradeId>');
      return;
    }
    return commands.action(username, [gameId, 'INSTALL_UPGRADE', `slotType=${slotType}`, `slotIndex=${slotIndex}`, `upgradeId=${upgradeId}`]);
  },

  // Help
  help() {
    console.log(`
${c(COLORS.bright, 'UP SHIP! CLI')} - Command-line client for playtesting

${c(COLORS.yellow, 'Session Management:')}
  upship login <user> <pass>    Login and store session
  upship register <user> <pass> Create account and login
  upship sessions               List all active sessions
  upship <user> logout          Logout user
  upship <user> whoami          Check current session

${c(COLORS.yellow, 'Game Lobby:')}
  upship <user> games [status]  List games (waiting/active/mine/all)
  upship <user> create <name>   Create a new game
  upship <user> join <gameId>   Join a game
  upship <user> leave <gameId>  Leave a game
  upship <user> faction <id> <faction>  Select faction (germany/britain/usa/italy)
  upship <user> start <gameId>  Start game (host only)

${c(COLORS.yellow, 'Game State:')}
  upship <user> state <gameId>      View game state
  upship <user> blueprint <gameId>  View your blueprint slots
  upship <user> upgrades <gameId>   List available upgrades
  upship <user> log <gameId> [n]    View action history

${c(COLORS.yellow, 'Actions (shorthand):')}
  upship <user> endturn <gameId>              End your turn
  upship <user> buygas <id> <type> [amount]   Buy gas cubes
  upship <user> loan <gameId>                 Take a loan (£30, -3 income)
  upship <user> draw <gameId> [count]         Draw cards
  upship <user> build <gameId> [count]        Build ships
  upship <user> recruit <id> <type> [count]   Recruit crew
  upship <user> launch <gameId> <shipId> [gas] Launch a ship (gas: hydrogen|helium)
  upship <user> tech <gameId> <techId>        Acquire technology from R&D

${c(COLORS.yellow, 'Actions (generic):')}
  upship <user> action <gameId> <TYPE> [key=value ...]

  Example: upship alice action abc123 INSTALL_UPGRADE slot=frame i=0 id=rigid_frame

${c(COLORS.gray, 'Environment Variables:')}
  UPSHIP_URL - API base URL (default: https://upship-production.up.railway.app)
`);
  }
};

// Main entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    commands.help();
    return;
  }

  // Special commands that don't require a username
  if (args[0] === 'login') {
    await commands.login(args.slice(1));
    return;
  }

  if (args[0] === 'register') {
    await commands.register(args.slice(1));
    return;
  }

  if (args[0] === 'sessions') {
    await commands.sessions();
    return;
  }

  // All other commands require username first
  const username = args[0];
  const command = args[1] || 'help';
  const cmdArgs = args.slice(2);

  // Check session exists
  const session = loadSession(username);
  if (!session && command !== 'help') {
    console.log(c(COLORS.red, `No session for '${username}'. Login first:`));
    console.log(`  upship login ${username} <password>`);
    return;
  }

  // Execute command
  if (commands[command]) {
    try {
      await commands[command](username, cmdArgs);
    } catch (error) {
      console.log(c(COLORS.red, `Error: ${error.message}`));
      if (process.env.DEBUG) {
        console.error(error);
      }
    }
  } else {
    console.log(c(COLORS.red, `Unknown command: ${command}`));
    console.log('Use "upship help" to see available commands.');
  }
}

main().catch(error => {
  console.error(c(COLORS.red, `Fatal error: ${error.message}`));
  process.exit(1);
});
