        let isPlaying = false;
        let visualizerActive = true;
        let currentTheme = 4;
        let timerActive = false;
        let timeLeft = 25 * 60;
        let currentMode = 'pomodoro';
        let focusStats = {
            streak: 0,
            todayMinutes: 0,
            totalHours: 0
        };
        let visualizerColors = ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.4)'];

        const themes = [
            'theme-dark',
            'theme-energetic', 
            'theme-calm',
            'theme-dark'
        ];

        const mockAlbums = [
            {
                title: "No music playing",
                artist: ":(",
                emoji: "😴",
                colors: ['#2c3e50', '#34495e']
            }
        ];

        const canvas = document.getElementById('visualizer');
        const ctx = canvas.getContext('2d');
        let animationId;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function drawVisualizer() {
            if (!visualizerActive) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const bars = 64;
            const barWidth = canvas.width / bars;
            
            for (let i = 0; i < bars; i++) {
                const height = Math.sin(Date.now() * 0.01 + i * 0.1) * 100 + 150;
                const opacity = Math.sin(Date.now() * 0.005 + i * 0.05) * 0.3 + 0.4;
                
                const colorIndex = i % visualizerColors.length;
                const baseColor = visualizerColors[colorIndex];
                
                ctx.fillStyle = convertToRgba(baseColor, opacity);
                ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 2, height);
            }
            
            for (let i = 0; i < 5; i++) {
                const x = Math.sin(Date.now() * 0.001 + i) * canvas.width * 0.4 + canvas.width * 0.5;
                const y = Math.cos(Date.now() * 0.002 + i) * canvas.height * 0.3 + canvas.height * 0.5;
                const radius = Math.sin(Date.now() * 0.003 + i) * 20 + 30;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                const colorIndex = i % visualizerColors.length;
                const baseColor = visualizerColors[colorIndex];
                
                gradient.addColorStop(0, convertToRgba(baseColor, 0.3));
                gradient.addColorStop(1, convertToRgba(baseColor, 0));
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            animationId = requestAnimationFrame(drawVisualizer);
        }

        function convertToRgba(color, alpha) {
            if (color.includes('rgba')) {
                return color;
            }
            
            if (color.includes('rgb(')) {
                return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
            }
            
            return `rgba(255, 255, 255, ${alpha})`;
        }

        function toggleVisualizer() {
            visualizerActive = !visualizerActive;
            const btn = document.getElementById('visualizerBtn');
            btn.textContent = visualizerActive ? '🎨 Visualizer ON' : '🎨 Visualizer OFF';
            btn.classList.toggle('active', visualizerActive);
            
            if (visualizerActive) {
                drawVisualizer();
            } else {
                cancelAnimationFrame(animationId);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        function cycleTheme() {
            currentTheme = (currentTheme + 1) % themes.length;
            document.body.className = themes[currentTheme];
            
            const album = mockAlbums[currentTheme];
            document.getElementById('albumArt').textContent = album.emoji;
            document.getElementById('trackTitle').textContent = album.title;
            document.getElementById('trackArtist').textContent = album.artist;
            
            const gradient = `linear-gradient(135deg, ${album.colors[0]} 0%, ${album.colors[1]} 100%)`;
            document.body.style.background = gradient;
        }

        function setMode(mode) {
            currentMode = mode;
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            switch(mode) {
                case 'pomodoro':
                    timeLeft = 25 * 60;
                    break;
                case 'deep':
                    timeLeft = 90 * 60;
                    break;
                case 'break':
                    timeLeft = 5 * 60;
                    break;
            }
            updateTimerDisplay();
        }

        function toggleTimer() {
            timerActive = !timerActive;
            const btn = document.getElementById('startTimer');
            btn.textContent = timerActive ? 'Pause Focus' : 'Start Focus';
            
            if (timerActive) {
                startFocusSession();
            }
        }

        function startFocusSession() {
            if (!timerActive) return;
            
            const interval = setInterval(() => {
                if (!timerActive) {
                    clearInterval(interval);
                    return;
                }
                
                timeLeft--;
                updateTimerDisplay();
                
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    completeFocusSession();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        function completeFocusSession() {
            timerActive = false;
            document.getElementById('startTimer').textContent = 'Start Focus';
            
            const sessionMinutes = currentMode === 'pomodoro' ? 25 : 
                                currentMode === 'deep' ? 90 : 5;
            focusStats.streak++;
            focusStats.todayMinutes += sessionMinutes;
            focusStats.totalHours = Math.floor(focusStats.todayMinutes / 60);
            
            updateStatsDisplay();
            
            const originalTimes = {
                'pomodoro': 25 * 60,
                'deep': 90 * 60,
                'break': 5 * 60
            };
            
            timeLeft = originalTimes[currentMode];
            updateTimerDisplay();
            
            createNotification('Focus session complete! 🎉');
        }

        function updateStatsDisplay() {
            document.getElementById('focusStreak').textContent = focusStats.streak;
            document.getElementById('todayMinutes').textContent = focusStats.todayMinutes;
            document.getElementById('totalHours').textContent = focusStats.totalHours;
        }

        function createNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.9);
                color: #333;
                padding: 1rem 2rem;
                border-radius: 10px;
                font-weight: bold;
                z-index: 1000;
                animation: fadeInOut 3s ease;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        }

        class SpotifyAuth {
            constructor() {
                this.clientId = '53afdf5a103e424f85bb03bbf5336d46'; 
                this.redirectUri = 'https://focusflw.vercel.app/index.html';
                this.scopes = [
                    'user-read-playback-state',
                    'user-modify-playback-state', 
                    'user-read-currently-playing',
                    'streaming',
                    'user-read-email',
                    'user-read-private'
                ].join(' ');
                this.accessToken = null;
                this.refreshToken = null;
                this.debugMode = false; 
            }

            // code verifier for PKCE
            generateCodeVerifier() {
                const array = new Uint32Array(56/2);
                window.crypto.getRandomValues(array);
                return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
            }

            //code for PKCE
            async generateCodeChallenge(verifier) {
                const encoder = new TextEncoder();
                const data = encoder.encode(verifier);
                const digest = await window.crypto.subtle.digest('SHA-256', data);
                return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');
            }

            

            async handleCallback() {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                
                if (code) {
                    const codeVerifier = sessionStorage.getItem('code_verifier');
                    if (codeVerifier) {
                        await this.exchangeCodeForToken(code, codeVerifier);
                       
                        window.history.replaceState({}, document.title, window.location.pathname);
                        return true;
                    }
                }
                return false;
            }

            async exchangeCodeForToken(code, codeVerifier) {
                const response = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: this.redirectUri,
                        client_id: this.clientId,
                        code_verifier: codeVerifier,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    this.accessToken = data.access_token;
                    this.refreshToken = data.refresh_token;
                    
                    sessionStorage.setItem('access_token', this.accessToken);
                    sessionStorage.setItem('refresh_token', this.refreshToken);
                    
                    this.onAuthSuccess();
                } else {
                    console.error('Failed to exchange code for token');
                }
            }

        
            getStoredToken() {
                this.accessToken = sessionStorage.getItem('access_token');
                this.refreshToken = sessionStorage.getItem('refresh_token');
                return this.accessToken;
            }

            async apiCall(endpoint) {
                if (!this.accessToken) {
                    throw new Error('No access token available');
                }

                if (this.debugMode) {
                    console.log(`Making API call to: ${endpoint}`);
                }

                const response = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                });

                if (this.debugMode) {
                    console.log(`API Response status: ${response.status}`);
                }

                if (response.status === 401) {
                    if (this.debugMode) console.log('Token expired, refreshing...');
                    await this.refreshAccessToken();
                    return this.apiCall(endpoint);
                }

                if (response.status === 403) {
                    // if no data is returned
                    const errorText = await response.text();
                    console.error(`API Error: ${response.status} - ${errorText}`);
                    return null;
                }

                if (response.status === 204) {
                    if (this.debugMode) console.log('No content (204) received.');
                    return null;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`API Error: ${response.status} - ${errorText}`);
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                if (this.debugMode) {
                    console.log('API Response data:', data);
                }
                return data;
            }

            async refreshAccessToken() {
                if (!this.refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: this.refreshToken,
                        client_id: this.clientId,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    this.accessToken = data.access_token;
                    sessionStorage.setItem('access_token', this.accessToken);
                }
            }

            onAuthSuccess() {
                document.getElementById('spotifyBtn').textContent = '🎵 Connected';
                document.getElementById('spotifyBtn').classList.add('active');
                startSpotifyIntegration();
            }
            showSetupInstructions() {
            const message = `
                Client ID missing
            `;
            
            createNotification('SpotifyClientID');
            console.log(message);
            
            
        }

            async authenticate() {
                // Generate code verifier and challenge
                const codeVerifier = this.generateCodeVerifier();
                const codeChallenge = await this.generateCodeChallenge(codeVerifier);
                sessionStorage.setItem('code_verifier', codeVerifier);

                const authUrl = `https://accounts.spotify.com/authorize?` +
                    `client_id=${encodeURIComponent(this.clientId)}` +
                    `&response_type=code` +
                    `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
                    `&scope=${encodeURIComponent(this.scopes)}` +
                    `&code_challenge_method=S256` +
                    `&code_challenge=${encodeURIComponent(codeChallenge)}`;

                if (this.debugMode) {
                    console.log('Redirecting to Spotify Auth URL:', authUrl);
                }
                window.location.href = authUrl;
            }

        }

        const spotifyAuth = new SpotifyAuth();

        async function startSpotifyIntegration() {
            console.log('Starting Spotify integration...');
            try {
                let currentTrack = await spotifyAuth.apiCall('me/player/currently-playing');
                console.log('Current track response:', currentTrack);

                if (currentTrack && currentTrack.item) {
                    console.log('Found currently playing track:', currentTrack.item.name);
                    updateTrackInfo(currentTrack.item);
                    extractColorsFromAlbumArt(currentTrack.item.album.images[0]?.url);
                } else {
                    console.log('No track currently playing or insufficient scope - trying recent tracks...');
                    const recentTracks = await spotifyAuth.apiCall('me/player/recently-played?limit=1');
                    if (recentTracks && recentTracks.items && recentTracks.items.length > 0) {
                        const track = recentTracks.items[0].track;
                        console.log('Using recent track:', track.name);
                        updateTrackInfo(track);
                        extractColorsFromAlbumArt(track.album.images[0]?.url);
                        createNotification('Using most recent track (nothing currently playing)');
                    } else {
                        createNotification('No music found. Start playing something on Spotify!');
                    }
                }
                //refresh for song check -- does not work ( only after refresh for some reason )
                setInterval(async () => {
                    try {
                        const track = await spotifyAuth.apiCall('me/player/currently-playing');
                        if (track && track.item) {
                            updateTrackInfo(track.item);
                            if (track.item.album.images[0]?.url) {
                                extractColorsFromAlbumArt(track.item.album.images[0].url);
                            }
                        }
                    } catch (error) {
                        console.log('Polling error:', error);
                    }
                }, 10000); 

            } catch (error) {
                console.error('Spotify integration error:', error);
                createNotification('Please open Spotify, then refresh this page.');
            }
        }

        function updateTrackInfo(track) {
            console.log('Updating track info:', track.name, 'by', track.artists[0].name);
            
            document.getElementById('trackTitle').textContent = track.name || 'Unknown Track';
            document.getElementById('trackArtist').textContent = track.artists ? 
                track.artists.map(a => a.name).join(', ') : 'Unknown Artist';
            
            if (track.album && track.album.images && track.album.images.length > 0) {
                const albumArtElement = document.getElementById('albumArt');
                const imageUrl = track.album.images[0].url;
                console.log('Setting album art:', imageUrl);
                albumArtElement.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 20px;" crossorigin="anonymous">`;
            }
        }

        function extractColorsFromAlbumArt(imageUrl) {
            if (!imageUrl) return;

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const colors = extractDominantColors(imageData.data);
                
                applyDynamicTheme(colors);
            };
            img.src = imageUrl;
        }
        //theme change
        function extractDominantColors(pixels) {
            const colorMap = {};
            const sampleSize = 4;
            
            for (let i = 0; i < pixels.length; i += 4 * sampleSize) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const alpha = pixels[i + 3];
                
                if (alpha > 128) { 
                    const color = `${Math.floor(r/32)*32},${Math.floor(g/32)*32},${Math.floor(b/32)*32}`;
                    colorMap[color] = (colorMap[color] || 0) + 1;
                }
            }
            
            // Get top 2 colors
            const sortedColors = Object.entries(colorMap)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 2)
                .map(([color]) => `rgb(${color})`);
                
            return sortedColors;
        }

        function applyDynamicTheme(colors) {
            if (colors.length >= 2) {
                const gradient = `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
                document.body.style.background = gradient;
                
                visualizerColors = colors;
            }
        }

        async function openSpotify() {
            console.log('Connect Spotify button clicked');
            
            if (spotifyAuth.getStoredToken()) {
                console.log('Found stored token, attempting to use it...');
                spotifyAuth.onAuthSuccess();
            } else {
                console.log('No stored token, starting authentication...');
                await spotifyAuth.authenticate();
            }
        }

        window.addEventListener('load', async () => {
            const wasCallback = await spotifyAuth.handleCallback();
            if (!wasCallback && spotifyAuth.getStoredToken()) {
                spotifyAuth.onAuthSuccess();
            }
        });

        function createFloatingParticles() {
            setInterval(() => {
                if (Math.random() > 0.7) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
                    document.body.appendChild(particle);
                    
                    setTimeout(() => {
                        if (particle.parentNode) {
                            particle.parentNode.removeChild(particle);
                        }
                    }, 8000);
                }
            }, 1000);
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        drawVisualizer();
        updateTimerDisplay();
        updateStatsDisplay();
        createFloatingParticles();

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `
        document.head.appendChild(style);