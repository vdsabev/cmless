(function () {
	const KEY = 'cmless-theme';
	const ORDER = ['system', 'dark', 'light'];
	const LABELS = {
		system: 'Use dark theme',
		dark: 'Use light theme',
		light: 'Use system theme',
	};

	function readPref() {
		try {
			const value = localStorage.getItem(KEY);
			return value === 'dark' || value === 'light' ? value : 'system';
		} catch {
			return 'system';
		}
	}

	function resolvedDark(pref) {
		return (
			pref === 'dark' ||
			(pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
		);
	}

	function applyPref(pref) {
		document.documentElement.classList.toggle('dark', resolvedDark(pref));
		document.documentElement.dataset.theme = pref;
		syncButton(pref);
	}

	function writePref(pref) {
		try {
			if (pref === 'system') localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, pref);
		} catch {}
		const apply = () => applyPref(pref);
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!reduceMotion && typeof document.startViewTransition === 'function') {
			try {
				document.startViewTransition({ update: apply, types: ['theme'] });
			} catch {
				apply();
			}
		} else {
			apply();
		}
	}

	function syncButton(pref) {
		const button = document.getElementById('theme-toggle');
		if (!button) return;
		button.setAttribute('aria-label', LABELS[pref] || LABELS.system);
	}

	function bind() {
		const button = document.getElementById('theme-toggle');
		if (button) {
			syncButton(readPref());
			button.addEventListener('click', () => {
				const current = readPref();
				const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
				writePref(next);
			});
		}

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onMedia = () => {
			if (readPref() === 'system') applyPref('system');
		};
		if (typeof media.addEventListener === 'function') media.addEventListener('change', onMedia);
		else media.addListener(onMedia);
	}

	applyPref(readPref());

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', bind);
	} else {
		bind();
	}
})();
