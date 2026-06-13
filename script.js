/* ============================================================
   Tai Bradley — resume site
   - Mobile nav toggle (always on)
   - Terminal hero typing animation (motion only)
   - Scroll-reveal for sections/cards (motion only)

   Motion is gated by the `js-motion` class on <html>, which the
   inline head script adds ONLY when the visitor has not requested
   reduced motion. With JS off or reduced motion, every piece of
   real content is already visible — this file just animates it in.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Mobile nav (unconditional) ---------- */
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

  /* If motion is disabled (no JS-motion class), stop here.
     Content is already in its final, visible state. */
  if (!document.documentElement.classList.contains('js-motion')) return;

  /* ---------- Terminal hero typing ---------- */
  var term = document.getElementById('term');
  var cursor = document.getElementById('cursor');
  var finalLine = document.getElementById('termFinal');

  if (term && cursor) {
    var cmds = Array.prototype.slice.call(term.querySelectorAll('[data-type]'));
    var outs = Array.prototype.slice.call(term.querySelectorAll('.term__out, .term__btns'));
    var cancelled = false;
    var done = false;

    // Stash each command's text, then clear it so it can be typed back.
    cmds.forEach(function (el) {
      el.dataset.text = el.textContent;
      el.textContent = '';
    });

    var sleep = function (ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    };

    var restCursor = function () {
      if (finalLine) finalLine.appendChild(cursor);
    };

    // Snap straight to the finished state (skip / on completion).
    var finish = function () {
      if (done) return;
      done = true;
      cancelled = true;
      cmds.forEach(function (el) {
        el.textContent = el.dataset.text;
        el.style.opacity = '1';
      });
      outs.forEach(function (el) { el.classList.add('show'); });
      restCursor();
    };

    var run = function () {
      return (async function () {
        for (var i = 0; i < cmds.length; i++) {
          var cmd = cmds[i];
          // Park the cursor right after the command being typed.
          cmd.insertAdjacentElement('afterend', cursor);
          cmd.style.opacity = '1';
          var text = cmd.dataset.text;
          for (var c = 0; c < text.length; c++) {
            if (cancelled) return;
            cmd.textContent += text.charAt(c);
            await sleep(40);
          }
          if (cancelled) return;
          await sleep(240); // command "runs"
          var output = cmd.parentElement.nextElementSibling;
          if (output && (output.classList.contains('term__out') ||
                         output.classList.contains('term__btns'))) {
            output.classList.add('show');
          }
          await sleep(200);
        }
        finish();
      })();
    };

    // Skip on first interaction or scroll.
    var skip = function () { finish(); };
    term.addEventListener('click', skip);
    window.addEventListener('scroll', skip, { once: true, passive: true });

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
      // No observer support: just show everything.
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }
  }
})();
