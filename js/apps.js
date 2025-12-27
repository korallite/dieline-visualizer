        const MIN_DIM = 2;
        const FIXED_ANGLE_DEG = 15;
        let currentDielineData = null;
        let panelsVisible = true;
        let isCadMode = false;

        // Transform State
        let scale = 1.0;
        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;
        let startX, startY;

        const container = document.getElementById('canvasContainer');
        const canvas = document.getElementById('dielineCanvas');
        const ctx = canvas.getContext('2d');

        function toggleTheme() {
            isCadMode = !isCadMode;
            document.body.className = isCadMode ? 'cad-mode' : 'light-mode';
            
            const themeLabel = document.getElementById('themeLabel');
            const themeIcon = document.getElementById('themeIcon');
            
            if(isCadMode) {
                themeLabel.textContent = 'LIGHT MODE';
                themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m3.343-5.657l.707.707m12.728 12.728l.707.707M6.343 17.657l-.707.707M17.657 6.343l-.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />';
            } else {
                themeLabel.textContent = 'CAD MODE';
                themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
            }
            drawDieline();
        }

        function toggleInterface(forceVal) {
            panelsVisible = forceVal !== undefined ? forceVal : !panelsVisible;
            const panels = document.querySelectorAll('.floating-panel');
            const toggleIcon = document.getElementById('toggleIcon');
            const toggleBtn = document.getElementById('togglePanels');

            panels.forEach(p => {
                if(panelsVisible) p.classList.remove('hidden-panel');
                else p.classList.add('hidden-panel');
            });

            if(panelsVisible) {
                toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
                toggleBtn.style.left = '375px';
            } else {
                toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />';
                toggleBtn.style.left = '40px';
            }
        }

        function hideInterfaceOnClick() {
            if(panelsVisible) toggleInterface(false);
        }

        function resizeCanvas() {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            drawDieline();
        }

        function resetView() {
            scale = 1.0;
            offsetX = 0;
            offsetY = 0;
            drawDieline();
        }

        function handleZoom(factor) {
            scale *= factor;
            drawDieline();
        }

        // Interaction Listeners
        container.addEventListener('mousedown', e => {
            isDragging = true;
            startX = e.clientX - offsetX;
            startY = e.clientY - offsetY;
        });

        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            offsetX = e.clientX - startX;
            offsetY = e.clientY - startY;
            drawDieline();
        });

        window.addEventListener('mouseup', () => isDragging = false);

        container.addEventListener('wheel', e => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            scale *= delta;
            drawDieline();
        }, { passive: false });

        function drawDieline() {
            const statusMessage = document.getElementById('statusMessage');
            const summaryDiv = document.getElementById('summaryText');
            
            const P = parseFloat(document.getElementById('txtP').value);
            const L = parseFloat(document.getElementById('txtL').value);
            const T = parseFloat(document.getElementById('txtT').value);
            const F = parseFloat(document.getElementById('txtF').value);
            const Pl = parseFloat(document.getElementById('txtPl').value);
            const coak = parseFloat(document.getElementById('txtCoak').value);
            
            if ([P, L, T, F, Pl].some(val => isNaN(val) || val < MIN_DIM)) {
                statusMessage.textContent = "Masukkan dimensi yang valid";
                statusMessage.className = "bg-red-50 text-red-600 px-6 py-2 rounded-full shadow-lg border border-red-100 text-sm font-medium opacity-100";
                return;
            }

            const angleRad = FIXED_ANGLE_DEG * Math.PI / 180;
            const H_FLAP = (L + Pl) / 2;
            const H_T = T;
            const totalWidthMM = F + P + L + P + L;
            const totalHeightMM = H_FLAP + H_T + H_FLAP;

            summaryDiv.innerHTML = `
                <div class="flex justify-between"><span>Lebar Sheet:</span><span class="font-bold">${totalWidthMM.toFixed(1)} mm</span></div>
                <div class="flex justify-between"><span>Tinggi Sheet:</span><span class="font-bold">${totalHeightMM.toFixed(1)} mm</span></div>
                <div class="flex justify-between"><span>Tinggi Flap:</span><span class="font-bold">${H_FLAP.toFixed(1)} mm</span></div>
                <div class="flex justify-between"><span>Tinggi Body:</span><span class="font-bold">${H_T.toFixed(1)} mm</span></div>
            `;

            const padding = 60;
            const fitScale = Math.min(
                (canvas.width - padding * 2) / totalWidthMM,
                (canvas.height - padding * 2) / totalHeightMM
            );

            const finalScale = fitScale * scale;
            const drawStartX = offsetX + (canvas.width - totalWidthMM * finalScale) / 2;
            const drawStartY = offsetY + (canvas.height - totalHeightMM * finalScale) / 2;

            const mmToPx = (mm) => mm * finalScale;
            const convertY = (yMM) => drawStartY + mmToPx(totalHeightMM - yMM);

            const R2_X = F;
            const R3_X = R2_X + P;
            const R4_X = R3_X + L;
            const R5_X = R4_X + P;
            const END_X = R5_X + L;
            const Y_BOT_F_START = 0;
            const Y_TOP_F_START = H_FLAP + H_T;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Theme colors
            const cutColor = isCadMode ? '#22d3ee' : '#1E40AF'; // Cyan vs Blue
            const creaseColor = isCadMode ? '#fbbf24' : '#D97706'; // Yellow vs Orange
            const bodyColor = isCadMode ? 'rgba(34, 211, 238, 0.05)' : '#E0F2FE';
            const flapColor = isCadMode ? 'rgba(239, 68, 68, 0.05)' : '#FEF2F2';
            const glueColor = isCadMode ? 'rgba(251, 191, 36, 0.05)' : '#FEF3C7';
            const textColor = isCadMode ? '#94a3b8' : '#4B5563';
            const measureColor = isCadMode ? '#4b5563' : '#9CA3AF';

            const rects = [];
            rects.push({ x: R2_X, y: H_FLAP, w: P, h: T, color: bodyColor });
            rects.push({ x: R3_X, y: H_FLAP, w: L, h: T, color: bodyColor });
            rects.push({ x: R4_X, y: H_FLAP, w: P, h: T, color: bodyColor });
            rects.push({ x: R5_X, y: H_FLAP, w: L, h: T, color: bodyColor });

            const panels = [{ x: R2_X, w: P }, { x: R3_X, w: L }, { x: R4_X, w: P }, { x: R5_X, w: L }];
            panels.forEach(p => {
                rects.push({ x: p.x + (coak/2), y: Y_TOP_F_START, w: p.w - coak, h: H_FLAP, color: flapColor });
                rects.push({ x: p.x + (coak/2), y: Y_BOT_F_START, w: p.w - coak, h: H_FLAP, color: flapColor });
            });

            const deltaY = F * Math.tan(angleRad);
            const flapLem = {
                points: [
                    { x: 0, y: H_FLAP + deltaY },
                    { x: F, y: H_FLAP },
                    { x: F, y: H_FLAP + T },
                    { x: 0, y: H_FLAP + T - deltaY }
                ],
                color: glueColor
            };

            currentDielineData = { P, L, T, F, Pl, coak, H_FLAP, totalWidthMM, totalHeightMM, rects, flapLem, R2_X, R3_X, R4_X, R5_X, END_X };

            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            
            // Flap Lem
            ctx.beginPath();
            ctx.fillStyle = flapLem.color;
            ctx.strokeStyle = cutColor;
            ctx.moveTo(drawStartX + mmToPx(flapLem.points[0].x), convertY(flapLem.points[0].y));
            flapLem.points.forEach(pt => ctx.lineTo(drawStartX + mmToPx(pt.x), convertY(pt.y)));
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Main Panels
            rects.forEach(r => {
                ctx.fillStyle = r.color;
                ctx.strokeStyle = cutColor;
                ctx.beginPath();
                ctx.rect(drawStartX + mmToPx(r.x), convertY(r.y + r.h), mmToPx(r.w), mmToPx(r.h));
                ctx.fill(); ctx.stroke();
            });

            // Crease Lines
            ctx.strokeStyle = creaseColor;
            ctx.setLineDash([5, 5]);
            [R2_X, R3_X, R4_X, R5_X].forEach(x => {
                ctx.beginPath();
                ctx.moveTo(drawStartX + mmToPx(x), convertY(0));
                ctx.lineTo(drawStartX + mmToPx(x), convertY(totalHeightMM));
                ctx.stroke();
            });
            [H_FLAP, H_FLAP + T].forEach(y => {
                ctx.beginPath();
                ctx.moveTo(drawStartX + mmToPx(0), convertY(y));
                ctx.lineTo(drawStartX + mmToPx(END_X), convertY(y));
                ctx.stroke();
            });

            // Dimensions
            ctx.setLineDash([]);
            ctx.fillStyle = textColor;
            ctx.font = `bold ${Math.max(7, 10 * scale)}px Inter`;
            ctx.textAlign = 'center';

            const drawHMeasure = (xStart, xEnd, yMM, text, off = 25, color = measureColor) => {
                const x1 = drawStartX + mmToPx(xStart);
                const x2 = drawStartX + mmToPx(xEnd);
                const y = convertY(yMM) - (off * scale);
                ctx.strokeStyle = color;
                ctx.beginPath();
                ctx.moveTo(x1, y); ctx.lineTo(x2, y);
                ctx.moveTo(x1, y-3); ctx.lineTo(x1, y+3);
                ctx.moveTo(x2, y-3); ctx.lineTo(x2, y+3);
                ctx.stroke();
                ctx.fillText(text, (x1 + x2) / 2, y - 5);
            };

            const drawVMeasure = (xMM, yStart, yEnd, text, off = 25, color = measureColor) => {
                const x = drawStartX + mmToPx(xMM) + (off * scale);
                const y1 = convertY(yStart);
                const y2 = convertY(yEnd);
                ctx.strokeStyle = color;
                ctx.beginPath();
                ctx.moveTo(x, y1); ctx.lineTo(x, y2);
                ctx.moveTo(x-3, y1); ctx.lineTo(x+3, y1);
                ctx.moveTo(x-3, y2); ctx.lineTo(x+3, y2);
                ctx.stroke();
                ctx.save();
                ctx.translate(x + 10, (y1 + y2) / 2);
                ctx.rotate(Math.PI / 2);
                ctx.fillText(text, 0, 0);
                ctx.restore();
            };

            drawHMeasure(0, F, totalHeightMM, `F:${F}`);
            drawHMeasure(R2_X, R3_X, totalHeightMM, `P:${P}`);
            drawHMeasure(R3_X, R4_X, totalHeightMM, `L:${L}`);
            drawHMeasure(R4_X, R5_X, totalHeightMM, `P:${P}`);
            drawHMeasure(R5_X, END_X, totalHeightMM, `L:${L}`);
            
            drawVMeasure(END_X, 0, H_FLAP, `Flap:${H_FLAP.toFixed(1)}`);
            drawVMeasure(END_X, H_FLAP, H_FLAP + T, `T:${T}`);
            drawVMeasure(END_X, H_FLAP + T, totalHeightMM, `Flap:${H_FLAP.toFixed(1)}`);
            
            drawHMeasure(0, END_X, totalHeightMM, `TOTAL: ${totalWidthMM.toFixed(1)} mm`, 55, isCadMode ? '#22d3ee' : '#4F46E5');
            drawVMeasure(END_X, 0, totalHeightMM, `TOTAL: ${totalHeightMM.toFixed(1)} mm`, 70, isCadMode ? '#22d3ee' : '#4F46E5');

            statusMessage.textContent = "Dieline Updated";
            statusMessage.className = `px-6 py-2 rounded-full shadow-lg border text-sm font-medium opacity-100 ${isCadMode ? 'bg-gray-800 text-cyan-400 border-cyan-900' : 'bg-white/90 text-emerald-600 border-emerald-100'}`;
            setTimeout(() => { statusMessage.style.opacity = '0'; }, 2000);
        }

        function exportToSVG() {
            if (!currentDielineData) return;
            const d = currentDielineData;
            const margin = 100;
            const w = d.totalWidthMM + margin * 3;
            const h = d.totalHeightMM + margin * 2.5;
            const sy = (y) => d.totalHeightMM - y + margin;
            const sx = (x) => x + margin;

            let svg = `<svg width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="background: white; font-family: 'Inter', sans-serif;">`;
            svg += `<rect width="100%" height="100%" fill="white" />`;

            svg += `<text x="${margin}" y="${margin/2}" font-size="6" font-weight="bold" fill="#1E40AF">B1 DIELINE SPECIFICATION</text>`;
            svg += `<text x="${margin}" y="${margin/2 + 5}" font-size="4" fill="#4B5563">Box Size: ${d.P} x ${d.L} x ${d.T} mm | Flap: ${d.H_FLAP.toFixed(1)} mm</text>`;
            svg += `<text x="${margin}" y="${margin/2 + 10}" font-size="3" fill="#6B7280">Sheet Width: ${d.totalWidthMM.toFixed(1)} mm | Sheet Height: ${d.totalHeightMM.toFixed(1)} mm</text>`;

            d.rects.forEach(r => {
                svg += `<rect x="${sx(r.x)}" y="${sy(r.y + r.h)}" width="${r.w}" height="${r.h}" fill="${r.color}" stroke="#1E40AF" stroke-width="0.3" />`;
            });
            const pts = d.flapLem.points.map(p => `${sx(p.x)},${sy(p.y)}`).join(' ');
            svg += `<polygon points="${pts}" fill="${d.flapLem.color}" stroke="#1E40AF" stroke-width="0.3" />`;

            const creaseStyle = `stroke="#D97706" stroke-width="0.25" stroke-dasharray="1,1"`;
            [d.R2_X, d.R3_X, d.R4_X, d.R5_X].forEach(x => svg += `<line x1="${sx(x)}" y1="${sy(0)}" x2="${sx(x)}" y2="${sy(d.totalHeightMM)}" ${creaseStyle} />`);
            [d.H_FLAP, d.H_FLAP + d.T].forEach(y => svg += `<line x1="${sx(0)}" y1="${sy(y)}" x2="${sx(d.END_X)}" y2="${sy(y)}" ${creaseStyle} />`);

            const drawSVGDimH = (x1, x2, y, txt) => {
                const midX = (x1 + x2) / 2;
                svg += `<line x1="${sx(x1)}" y1="${sy(y)-5}" x2="${sx(x2)}" y2="${sy(y)-5}" stroke="#9CA3AF" stroke-width="0.2" />`;
                svg += `<text x="${sx(midX)}" y="${sy(y)-7}" font-size="3" fill="#6B7280" text-anchor="middle">${txt}</text>`;
            };
            const drawSVGDimV = (x, y1, y2, txt) => {
                const midY = (y1 + y2) / 2;
                svg += `<line x1="${sx(x)+5}" y1="${sy(y1)}" x2="${sx(x)+5}" y2="${sy(y2)}" stroke="#9CA3AF" stroke-width="0.2" />`;
                svg += `<text x="${sx(x)+7}" y="${sy(midY)}" font-size="3" fill="#6B7280" transform="rotate(90, ${sx(x)+7}, ${sy(midY)})">${txt}</text>`;
            };

            drawSVGDimH(0, d.F, d.totalHeightMM + 5, `F:${d.F}`);
            drawSVGDimH(d.R2_X, d.R3_X, d.totalHeightMM + 5, `P:${d.P}`);
            drawSVGDimH(d.R3_X, d.R4_X, d.totalHeightMM + 5, `L:${d.L}`);
            drawSVGDimH(d.R4_X, d.R5_X, d.totalHeightMM + 5, `P:${d.P}`);
            drawSVGDimH(d.R5_X, d.END_X, d.totalHeightMM + 5, `L:${d.L}`);
            
            drawSVGDimV(d.END_X + 5, 0, d.H_FLAP, `Flap:${d.H_FLAP.toFixed(1)}`);
            drawSVGDimV(d.END_X + 5, d.H_FLAP, d.H_FLAP + d.T, `T:${d.T}`);
            drawSVGDimV(d.END_X + 5, d.H_FLAP + d.T, d.totalHeightMM, `Flap:${d.H_FLAP.toFixed(1)}`);

            svg += `<text x="${sx(d.totalWidthMM/2)}" y="${sy(d.totalHeightMM+20)}" font-size="5" font-weight="bold" fill="#4F46E5" text-anchor="middle">Total Lebar: ${d.totalWidthMM.toFixed(1)} mm</text>`;

            svg += `</svg>`;
            const blob = new Blob([svg], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `dieline_B1_${d.P}x${d.L}x${d.T}.svg`;
            link.click();
        }

        window.onload = resizeCanvas;
        window.onresize = resizeCanvas;
