/**
 * Modal & Drawer Controller
 */

const Modal = {
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  initListeners() {
    // Backdrop click to close modals
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close, [data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) {
          modal.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    });

    // Drawer backdrop click
    const drawerOverlay = document.getElementById('tenant-drawer-overlay');
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', (e) => {
        if (e.target === drawerOverlay) {
          drawerOverlay.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }

    // Drawer close button
    const drawerClose = document.getElementById('drawer-close-btn');
    if (drawerClose && drawerOverlay) {
      drawerClose.addEventListener('click', () => {
        drawerOverlay.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  }
};

window.Modal = Modal;
