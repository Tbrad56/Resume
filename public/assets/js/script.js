/* ============================================================
   Tai Bradley — dossier resume site
   - Motion gate (js-motion class, reduced-motion aware)
   - Mobile nav toggle
   - Terminal recon/declassify typing animation (motion only)
   - Scroll reveal (motion only)
   - Redaction tap-to-declassify
   - Secure-channel contact form
   ============================================================ */
(function () {
  'use strict';

  var PAGE_LOADED_AT = Date.now();

  /* ---------- Motion gate ---------- */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-motion');
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Redactions: tap/keyboard toggle (all visitors) ---------- */
  document.querySelectorAll('.redact').forEach(function (el) {
    var open = function () { el.classList.toggle('is-open'); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  /* ---------- Secure-channel form (all visitors) ---------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: form.name.value,
        email: form.email.value,
        message: form.message.value,
        website: form.website.value, // honeypot — humans leave empty
        ts: PAGE_LOADED_AT,
      };
      status.className = 'contact-form__status';
      status.textContent = 'TRANSMITTING…';
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
        .then(function (r) {
          if (r.ok) {
            status.className = 'contact-form__status ok';
            status.textContent = r.j.message || 'TRANSMISSION RECEIVED — channel secured';
            form.reset();
          } else {
            status.className = 'contact-form__status err';
            status.textContent = r.j.error || 'TRANSMISSION FAILED — use direct channel';
          }
        })
        .catch(function () {
          status.className = 'contact-form__status err';
          status.textContent = 'TRANSMISSION FAILED — use direct channel below';
        });
    });
  }

  /* Motion-only enhancements below. Without js-motion, content is
     already fully visible — nothing else to do. */
  if (!document.documentElement.classList.contains('js-motion')) return;

  /* ---------- Terminal typing ---------- */
  var term = document.getElementById('term');
  var cursor = document.getElementById('cursor');
  var finalLine = document.getElementById('termFinal');

  if (term && cursor) {
    var cmds = Array.prototype.slice.call(term.querySelectorAll('[data-type]'));
    var outs = Array.prototype.slice.call(term.querySelectorAll('.term__out'));
    var cancelled = false;
    var done = false;

    cmds.forEach(function (el) {
      el.dataset.text = el.textContent;
      el.textContent = '';
    });

    var sleep = function (ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    };

    var finish = function () {
      if (done) return;
      done = true;
      cancelled = true;
      cmds.forEach(function (el) {
        el.textContent = el.dataset.text;
        el.style.opacity = '1';
      });
      outs.forEach(function (el) { el.classList.add('show'); });
      if (finalLine) finalLine.insertBefore(cursor, null);
    };

    var run = function () {
      return (async function () {
        for (var i = 0; i < cmds.length; i++) {
          var cmd = cmds[i];
          cmd.insertAdjacentElement('afterend', cursor);
          cmd.style.opacity = '1';
          var text = cmd.dataset.text;
          for (var c = 0; c < text.length; c++) {
            if (cancelled) return;
            cmd.textContent += text.charAt(c);
            await sleep(38);
          }
          if (cancelled) return;
          await sleep(220); // command "runs"
          // Reveal every consecutive output block after this command line
          var out = cmd.parentElement.nextElementSibling;
          while (out && out.classList.contains('term__out')) {
            out.classList.add('show');
            await sleep(180);
            if (cancelled) return;
            out = out.nextElementSibling;
          }
        }
        finish();
      })();
    };

    term.addEventListener('click', function () { finish(); });
    window.addEventListener('scroll', function () { finish(); }, { once: true, passive: true });

    run();
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }
  }
})();
