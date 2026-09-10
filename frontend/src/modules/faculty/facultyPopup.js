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

export function showFacultyErrorPopup(title, message, duration = 4500) {
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
        border: 1px solid #f87171;
        border-left: 5px solid #dc2626;
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

    const errorSvg = `
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #fef2f2; border: 1px solid #fecaca; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #dc2626;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        </div>
    `;

    const closeBtnHtml = `
        <button class="faculty-popup-close" type="button" aria-label="Close notification" style="background: none; border: none; padding: 2px 6px; cursor: pointer; color: #94a3b8; font-size: 16px; line-height: 1; border-radius: 4px; transition: color 0.15s ease;">
            &times;
        </button>
    `;

    popup.innerHTML = `
        ${errorSvg}
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 0.92rem; color: #991b1b; margin-bottom: 2px;">
                ${title}
            </div>
            <div style="font-size: 0.83rem; color: #475569; line-height: 1.45;">
                ${message}
            </div>
        </div>
        ${closeBtnHtml}
    `;

    container.appendChild(popup);

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

/**
 * Custom in-app alert & confirmation modal (No browser localhost dialogs).
 */
export function showCustomConfirmModal({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    detailsHtml = '',
    confirmText = 'Yes, Re-assign',
    cancelText = 'Cancel',
    onConfirm = () => {},
    onCancel = () => {}
}) {
    const existing = document.getElementById('faculty-confirm-modal');
    if (existing) existing.remove();

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'faculty-confirm-modal';
    modalBackdrop.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        opacity: 0;
        transition: opacity 0.2s ease-out;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        width: 100%;
        max-width: 490px;
        padding: 1.5rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
        transform: scale(0.95);
        transition: transform 0.2s ease-out;
        font-family: inherit;
    `;

    // Modern stroke alert icon
    const alertIcon = `
        <div style="width: 44px; height: 44px; border-radius: 50%; background: #fff7ed; border: 1px solid #fed7aa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ea580c; margin-bottom: 1rem;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        </div>
    `;

    dialog.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            ${alertIcon}
            <button class="confirm-modal-close" type="button" aria-label="Close" style="background: none; border: none; font-size: 1.4rem; line-height: 1; color: #94a3b8; cursor: pointer; padding: 2px 6px;">&times;</button>
        </div>
        <h3 style="margin: 0 0 0.5rem; font-size: 1.2rem; font-weight: 700; color: #0f172a;">${title}</h3>
        <p style="margin: 0 0 1rem; font-size: 0.92rem; color: #475569; line-height: 1.5;">${message}</p>
        ${detailsHtml ? `<div style="margin-bottom: 1.25rem; padding: 0.85rem 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.86rem; color: #334155;">${detailsHtml}</div>` : ''}
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
            <button type="button" class="btn btn-outline btn-sm confirm-modal-cancel" style="padding: 0.5rem 1.15rem; font-size: 0.88rem; font-weight: 600; cursor: pointer;">${cancelText}</button>
            <button type="button" class="btn btn-primary btn-sm confirm-modal-confirm shadow-hover" style="padding: 0.5rem 1.25rem; font-size: 0.88rem; font-weight: 600; background: #059669; border-color: #059669; cursor: pointer;">${confirmText}</button>
        </div>
    `;

    modalBackdrop.appendChild(dialog);
    document.body.appendChild(modalBackdrop);

    requestAnimationFrame(() => {
        modalBackdrop.style.opacity = '1';
        dialog.style.transform = 'scale(1)';
    });

    const close = () => {
        modalBackdrop.style.opacity = '0';
        dialog.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (modalBackdrop.parentElement) modalBackdrop.parentElement.removeChild(modalBackdrop);
        }, 200);
    };

    dialog.querySelector('.confirm-modal-confirm')?.addEventListener('click', () => {
        close();
        onConfirm();
    });

    dialog.querySelector('.confirm-modal-cancel')?.addEventListener('click', () => {
        close();
        onCancel();
    });

    dialog.querySelector('.confirm-modal-close')?.addEventListener('click', () => {
        close();
        onCancel();
    });

    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            close();
            onCancel();
        }
    });
}

