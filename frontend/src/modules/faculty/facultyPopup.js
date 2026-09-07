/**
 * Faculty Success Popup Notification System
 * Elegant, accessible floating notification popup without over-the-top emojis.
 */

export function showFacultySuccessPopup(title, message, duration = 4200) {
    let container = document.getElementById('faculty-popup-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'faculty-popup-container';
        container.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
            max-width: 420px;
            width: calc(100vw - 48px);
        `;
        document.body.appendChild(container);
    }

    const popup = document.createElement('div');
    popup.className = 'faculty-popup-toast';
    popup.style.cssText = `
        pointer-events: auto;
        background: #ffffff;
        border: 1px solid #10b981;
        border-left: 5px solid #059669;
        border-radius: 10px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
        padding: 14px 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        opacity: 0;
        transform: translateY(-12px) scale(0.98);
        transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: inherit;
    `;

    // Standard stroke checkmark SVG (clean, professional, zero emojis)
    const checkmarkSvg = `
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #ecfdf5; border: 1px solid #a7f3d0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #059669;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
    `;

    // Clean close button
    const closeBtnHtml = `
        <button class="faculty-popup-close" type="button" aria-label="Close notification" style="background: none; border: none; padding: 2px 6px; cursor: pointer; color: #94a3b8; font-size: 16px; line-height: 1; border-radius: 4px; transition: color 0.15s ease;">
            &times;
        </button>
    `;

    popup.innerHTML = `
        ${checkmarkSvg}
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 0.92rem; color: #0f172a; margin-bottom: 2px;">
                ${title}
            </div>
            <div style="font-size: 0.83rem; color: #475569; line-height: 1.45;">
                ${message}
            </div>
        </div>
        ${closeBtnHtml}
    `;

    container.appendChild(popup);

    // Trigger smooth slide-in
    requestAnimationFrame(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'translateY(0) scale(1)';
    });

    let isDismissed = false;
    let timerId = null;

    const dismiss = () => {
        if (isDismissed) return;
        isDismissed = true;
        if (timerId) clearTimeout(timerId);

        popup.style.opacity = '0';
        popup.style.transform = 'translateY(-8px) scale(0.97)';
        setTimeout(() => {
            if (popup.parentElement) {
                popup.parentElement.removeChild(popup);
            }
        }, 250);
    };

    const closeBtn = popup.querySelector('.faculty-popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismiss();
        });
        closeBtn.addEventListener('mouseenter', () => { closeBtn.style.color = '#1e293b'; });
        closeBtn.addEventListener('mouseleave', () => { closeBtn.style.color = '#94a3b8'; });
    }

    timerId = setTimeout(dismiss, duration);
}
