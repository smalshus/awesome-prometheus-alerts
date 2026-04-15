import { record, recordAndWait } from './pipe';

export function initSponsorClickTracking(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-sponsor-name]').forEach((a) => {
    a.addEventListener('click', async (e) => {
      const me = e as MouseEvent;
      const href = a.href;
      const sponsorName = a.dataset.sponsorName!;
      const sponsorSlot = a.dataset.sponsorSlot!;
      const eventData = { sponsor_name: sponsorName, sponsor_url: href, sponsor_slot: sponsorSlot };

      // Modifier / non-primary clicks: track fire-and-forget, let browser handle navigation
      if (me.button !== 0 || me.metaKey || me.ctrlKey || me.shiftKey) {
        record('sponsor_click', eventData);
        return;
      }

      // Plain left-click: block navigation until event is recorded
      e.preventDefault();
      // Open blank tab now (inside user gesture) to avoid popup-blocker after await
      const w = a.target === '_blank' ? window.open('', '_blank') : null;
      try {
        await recordAndWait('sponsor_click', eventData);
      } finally {
        if (w) {
          w.location.href = href;
        } else {
          window.open(href, '_blank') ?? (window.location.href = href);
        }
      }
    });
  });
}
