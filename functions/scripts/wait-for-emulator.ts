import http from 'http';

const startTime = Date.now();
const timeout = 90000; // 90 seconds
const paddingTime = 5000; // 5 seconds padding

const readyPorts = new Set<number>();

function startCountdown(): void {
  let secondsLeft = paddingTime / 1000;
  console.log(`\nStarting ${secondsLeft} second countdown...`);
  
  const countdown = setInterval(() => {
    secondsLeft--;
    if (secondsLeft > 0) {
      process.stdout.write(`\r${secondsLeft} seconds remaining...`);
    } else {
      clearInterval(countdown);
      console.log('\nPadding complete. Proceeding with tests...');
      process.exit(0);
    }
  }, 1000);
}

function checkAuthEmulator(): void {
  http.get('http://localhost:9099', (res) => {
    if (res.statusCode === 200) {
      console.log('Auth emulator is ready!');
      readyPorts.add(9099);
      
      if (readyPorts.size === 3) {
        console.log('All emulators are ready!');
        startCountdown();
      }
    } else {
      setTimeout(checkAuthEmulator, 1000);
    }
  }).on('error', () => {
    if (Date.now() - startTime > timeout) {
      console.error('Timeout waiting for Auth emulator');
      process.exit(1);
    }
    setTimeout(checkAuthEmulator, 1000);
  });
}

function checkFunctionsEmulator(): void {
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/th-stray/us-central1/listMyReports',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    // Functions emulator returns 401 for unauthorized requests, which means it's running
    if (res.statusCode === 401) {
      console.log(`Functions emulator is ready! (Status: ${res.statusCode})`);
      readyPorts.add(5001);
      
      if (readyPorts.size === 3) {
        console.log('All emulators are ready!');
        startCountdown();
      }
    } else {
      setTimeout(checkFunctionsEmulator, 1000);
    }
  });

  req.on('error', () => {
    if (Date.now() - startTime > timeout) {
      console.error('Timeout waiting for Functions emulator');
      process.exit(1);
    }
    setTimeout(checkFunctionsEmulator, 1000);
  });

  // Send empty data object as required by the function
  req.write(JSON.stringify({ data: {} }));
  req.end();
}

function checkPort(port: number): void {
  // Skip Auth and Functions ports as they're handled separately
  if (port === 9099) {
    checkAuthEmulator();
    return;
  }
  if (port === 5001) {
    checkFunctionsEmulator();
    return;
  }

  http.get(`http://localhost:${port}`, (res) => {
    // Consider any response as valid - server is running
    console.log(`Port ${port} is ready! (Status: ${res.statusCode})`);
    readyPorts.add(port);
    
    if (readyPorts.size === 3) {
      console.log('All emulators are ready!');
      startCountdown();
    }
  }).on('error', () => {
    if (Date.now() - startTime > timeout) {
      console.error(`Timeout waiting for port ${port}`);
      process.exit(1);
    }
    setTimeout(() => checkPort(port), 1000);
  });
}

console.log('Waiting for emulators to be ready...');
checkPort(4000); // Functions admin port
checkPort(5001); // Functions HTTP port
checkPort(9099); // Auth port 