/* ========= 天气动画（全屏背景式 v3）========== */
(function() {
    var cvs = document.getElementById('weather-canvas');
    if (!cvs) { console.log('[天气] 未找到canvas'); return; }
    var ctx = cvs.getContext('2d');
    var header = document.getElementById('mainHeader');
    var W = 0, H = 0;
    var weatherType = 'cloudy';
    var particles = [];
    var animId = null;
    var frameCount = 0;
    var lightningTimer = 0;
    var lightningFlash = 0;
    var snowGround = {};

    function resizeCanvas() {
        if (!header) return;
        var rect = header.getBoundingClientRect();
        W = Math.round(rect.width);
        H = Math.round(rect.height);
        if (cvs.width !== W) cvs.width = W;
        if (cvs.height !== H) cvs.height = H;
        snowGround = {};
    }

    function getWeatherType(code) {
        if (code === 0 || code === 1) return 'sunny';
        if (code === 2 || code === 3) return 'cloudy';
        if (code === 45 || code === 48) return 'fog';
        if ([51,53,55,61,63,65,80,81,82].includes(code)) return 'rain';
        if ([95,96,99].includes(code)) return 'thunderstorm';
        if ([71,73,75,77,85,86].includes(code)) return 'snow';
        return 'cloudy';
    }

    function fetchWeather() {
        if (!navigator.geolocation) { initParticles(); return; }
        navigator.geolocation.getCurrentPosition(function(pos) {
            fetch('https://api.open-meteo.com/v1/forecast?latitude=' + pos.coords.latitude + '&longitude=' + pos.coords.longitude + '&current=weather_code')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    weatherType = getWeatherType(data.current.weather_code);
                    snowGround = {};
                    initParticles();
                })
                .catch(function() { initParticles(); });
        }, function() { initParticles(); }, {timeout: 8000});
    }

    function initParticles() {
        particles = [];
        frameCount = 0;
        lightningTimer = 0;
        lightningFlash = 0;
        if (weatherType === 'rain' || weatherType === 'thunderstorm') {
            var density = Math.max(30, Math.floor(W * H / 8000));
            for (var i = 0; i < density; i++) {
                particles.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vy: 10 + Math.random() * 15,
                    vx: -1 - Math.random() * 1.5,
                    len: 15 + Math.random() * 20,
                    opacity: 0.3 + Math.random() * 0.4,
                    splash: false
                });
            }
        } else if (weatherType === 'sunny') {
            for (var i = 0; i < 18; i++) {
                particles.push({
                    side: Math.floor(Math.random() * 4),
                    pos: Math.random(),
                    targetAngle: Math.random() * Math.PI * 2,
                    speed: 0.003 + Math.random() * 0.004,
                    opacity: 0.08 + Math.random() * 0.15,
                    len: 30 + Math.random() * 60
                });
            }
            for (var i = 0; i < 25; i++) {
                particles.push({
                    isGlow: true,
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.2,
                    r: 1 + Math.random() * 2,
                    opacity: 0.2 + Math.random() * 0.5
                });
            }
        } else if (weatherType === 'snow') {
            var sdensity = Math.max(20, Math.floor(W * H / 6000));
            for (var i = 0; i < sdensity; i++) {
                particles.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vy: 0.5 + Math.random() * 1.5,
                    vxBase: (Math.random() - 0.5) * 0.8,
                    r: 2 + Math.random() * 3,
                    phase: Math.random() * Math.PI * 2,
                    opacity: 0.6 + Math.random() * 0.4
                });
            }
        } else if (weatherType === 'fog') {
            var fdensity = Math.max(5, Math.floor(W * H / 40000));
            for (var i = 0; i < fdensity; i++) {
                particles.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * 0.15,
                    vy: (Math.random() - 0.5) * 0.1,
                    r: 50 + Math.random() * 100,
                    opacity: 0.04 + Math.random() * 0.1
                });
            }
        } else {
            for (var i = 0; i < 5; i++) {
                particles.push({
                    x: (W / 5) * i + Math.random() * 60,
                    y: 15 + Math.random() * (H - 30),
                    vx: 0.15 + Math.random() * 0.25,
                    opacity: 0.5 + Math.random() * 0.3,
                    scale: 0.7 + Math.random() * 0.6
                });
            }
        }
    }

    function drawCloud(cx, cy, opacity, scale) {
        ctx.fillStyle = 'rgba(255,255,255,' + opacity + ')';
        ctx.beginPath();
        var circles = [
            {x:0, y:0, r:18*scale},
            {x:12*scale, y:-5*scale, r:14*scale},
            {x:-10*scale, y:-3*scale, r:13*scale},
            {x:6*scale, y:6*scale, r:12*scale},
            {x:-5*scale, y:7*scale, r:10*scale},
            {x:18*scale, y:3*scale, r:10*scale},
            {x:-15*scale, y:4*scale, r:9*scale}
        ];
        for (var i = 0; i < circles.length; i++) {
            ctx.moveTo(cx + circles[i].x + circles[i].r, cy + circles[i].y);
            ctx.arc(cx + circles[i].x, cy + circles[i].y, circles[i].r, 0, Math.PI * 2);
        }
        ctx.fill();
    }

    function draw() {
        frameCount++;
        if (W === 0 || H === 0) { animId = requestAnimationFrame(draw); return; }

        if (weatherType === 'sunny') {
            var sg = ctx.createLinearGradient(0, 0, 0, H);
            sg.addColorStop(0, '#4a90e2');
            sg.addColorStop(1, '#ffcc80');
            ctx.fillStyle = sg;
            ctx.fillRect(0, 0, W, H);
            var sunX = W * 0.5, sunY = H * 0.3, sunR = Math.min(W, H) * 0.22;
            var sunG = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, sunR);
            sunG.addColorStop(0, 'rgba(255,255,200,0.95)');
            sunG.addColorStop(0.5, 'rgba(255,230,100,0.5)');
            sunG.addColorStop(1, 'rgba(255,200,50,0)');
            ctx.fillStyle = sunG;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
            ctx.fill();
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                if (p.isGlow) {
                    ctx.fillStyle = 'rgba(255,240,180,' + p.opacity + ')';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < -5 || p.x > W+5 || p.y < -5 || p.y > H+5) { p.x = Math.random()*W; p.y = Math.random()*H; }
                } else {
                    var startX, startY;
                    if (p.side === 0) { startX = p.pos * W; startY = 0; }
                    else if (p.side === 1) { startX = W; startY = p.pos * H; }
                    else if (p.side === 2) { startX = p.pos * W; startY = H; }
                    else { startX = 0; startY = p.pos * H; }
                    var ex = sunX + Math.cos(p.targetAngle) * p.len;
                    var ey = sunY + Math.sin(p.targetAngle) * p.len;
                    ctx.strokeStyle = 'rgba(255,220,100,' + p.opacity + ')';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(ex, ey);
                    ctx.stroke();
                    p.targetAngle += p.speed;
                }
            }
        } else if (weatherType === 'cloudy') {
            var cg = ctx.createLinearGradient(0, 0, 0, H);
            cg.addColorStop(0, '#7a8b99');
            cg.addColorStop(1, '#cfd9e0');
            ctx.fillStyle = cg;
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                drawCloud(p.x, p.y, p.opacity, p.scale);
                p.x += p.vx;
                if (p.x > W + 60) { p.x = -80; p.y = 15 + Math.random() * (H - 30); }
            }
        } else if (weatherType === 'rain' || weatherType === 'thunderstorm') {
            var bgColor = weatherType === 'thunderstorm' ? '#0b0c10' : '#1c2833';
            var rg = ctx.createLinearGradient(0, 0, 0, H);
            rg.addColorStop(0, bgColor);
            rg.addColorStop(1, weatherType === 'thunderstorm' ? '#15171f' : '#2c3e50');
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, W, H);
            if (weatherType === 'thunderstorm') {
                lightningTimer++;
                if (lightningFlash > 0) {
                    ctx.fillStyle = 'rgba(255,255,255,' + (lightningFlash * 0.15) + ')';
                    ctx.fillRect(0, 0, W, H);
                    lightningFlash -= 0.05;
                    if (lightningFlash <= 0) lightningFlash = 0;
                }
                if (lightningTimer > 180 + Math.random() * 420) {
                    lightningFlash = 1.0;
                    lightningTimer = 0;
                }
                ctx.fillStyle = 'rgba(30,30,40,0.3)';
                var t = frameCount * 0.3;
                for (var L = 0; L < 3; L++) {
                    ctx.beginPath();
                    for (var x = 0; x <= W; x += 6) {
                        var y = H * 0.1 + L * H * 0.12 + Math.sin((x + t + L * 80) * 0.02) * 12;
                        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.lineTo(W, H * 0.35 + L * 10);
                    ctx.lineTo(0, H * 0.35 + L * 10);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = 'rgba(174,194,224,0.55)';
            ctx.lineWidth = 1.2;
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                if (p.splash) {
                    ctx.fillStyle = 'rgba(174,194,224,0.4)';
                    for (var s = 0; s < 3; s++) {
                        var sx = p.x + (Math.random()-0.5) * 6;
                        var sy = H - 2 + Math.random() * 3;
                        ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI*2); ctx.fill();
                    }
                    p.splash = false;
                }
                ctx.strokeStyle = 'rgba(174,194,224,' + p.opacity + ')';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx, p.y + p.len);
                ctx.stroke();
                p.y += p.vy;
                p.x += p.vx;
                if (p.y > H) {
                    p.y = -p.len - 5;
                    p.x = Math.random() * W;
                    if (Math.random() < 0.3) p.splash = true;
                }
            }
        } else if (weatherType === 'snow') {
            var sg2 = ctx.createLinearGradient(0, 0, 0, H);
            sg2.addColorStop(0, '#bdd4e7');
            sg2.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = sg2;
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ffffff';
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                var sway = Math.sin(frameCount * 0.02 + p.phase) * p.vxBase * 2;
                ctx.beginPath();
                ctx.arc(p.x + sway, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                p.y += p.vy;
                p.x += sway * 0.3;
                if (p.y > H - 3) {
                    var gx = Math.round(p.x / 4) * 4;
                    if (!snowGround[gx]) snowGround[gx] = 0;
                    snowGround[gx] = Math.min(snowGround[gx] + 0.5, 8);
                    p.y = -5; p.x = Math.random() * W;
                }
            }
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            var keys = Object.keys(snowGround);
            for (var j = 0; j < keys.length; j++) {
                var kx = parseInt(keys[j]);
                ctx.beginPath();
                ctx.ellipse(kx, H, 3, snowGround[keys[j]], 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (weatherType === 'fog') {
            ctx.fillStyle = '#b0b5b9';
            ctx.fillRect(0, 0, W, H);
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                ctx.fillStyle = 'rgba(220,225,230,' + p.opacity + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                p.x += p.vx; p.y += p.vy;
                if (p.x < -p.r*2) p.x = W + p.r;
                if (p.x > W + p.r*2) p.x = -p.r;
                if (p.y < -p.r*2) p.y = H + p.r;
                if (p.y > H + p.r*2) p.y = -p.r;
            }
        }
        animId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    fetchWeather();
    draw();
})();
