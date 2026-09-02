/*
 * Blocked words
 * Voeg hieronder woorden of zinnen toe die nergens in de website mogen worden ingevoerd.
 * De controle werkt hoofdletterongevoelig en geldt voor inputs, tekstvelden,
 * opmerkingen, feedback, productnamen, etc.
 */
(function () {
  'use strict';

  // =========================
  // LIJST MET GEBLOKKEERDE WOORDEN
  // =========================
  window.BLOCKED_WORDS = [
    'l systeem', 
    'kut systeem', 
    'kut', 
    'kanker', 
    'mongool', 
    'loser', 
    'kut lars', 
    'l lars', 
    'fuck', 
    'gay', 
    'hoer', 
    'neuken', 
    'raggen', 
    'verkrachten', 
    'seksen', 
    'sex', 
    'opgekankerd', 
    'nigger', 
    'nigga', 
    'aftrekken', 
    'masturberen', 
    'kkr', 
    'lul', 
    'piemel', 
    'pimel', 
    'plassertje', 
    'comdoom', 
    'vagina', 
    'bek', 
    'vape', 
    'sigaret', 
    'sigaar', 
    'wiet', 
    'cocaiene', 
    'drugs',

    // Extra geblokkeerde woorden + veelvoorkomende typvarianten
    'tering', 'ttering', 'terring', 'terinng', 'terring', 'ter1ng', 'teringg', 'terinng', 't3ring',
    'tifus', 'tyfus', 'tifuss', 'tifusss', 'tifus', 'tifuz', 'tifoes', 'tifoes', 't1fus', 'tif4s',
    'fiefus', 'fiefuss', 'fieffus', 'fiefuz', 'fiefusss', 'fiefus', 'fiefuss', 'f1efus', 'fief4s',
    'pijpen', 'pypen', 'pijpenn', 'pijpe', 'pijpen', 'pijpn', 'pijpen', 'pijp3n', 'p1jpen', 'pijpenn',
    'kancer', 'cancer', 'canker', 'kankar', 'kankor', 'kankur', 'kankerr', 'kancerr', 'cankerr', 'kkr',

    // 'voorbeeld',
    // 'voorbeeld zin'
  ];

  // Genereer automatisch veel voorkomende typvarianten voor ELK geblokkeerd woord.
  // Zo worden o.a. hoofdletters, dubbele letters, leetspeak en veelgebruikte
  // lettervervangingen afgevangen zonder voor ieder woord handmatig varianten
  // te hoeven onderhouden.
  (function addTypingVariants() {
    var substitutions = {
      'a': ['a', '4', '@'],
      'e': ['e', '3'],
      'i': ['i', '1', '!', 'y'],
      'o': ['o', '0'],
      's': ['s', '5', 'z'],
      't': ['t', '7'],
      'g': ['g', '9', 'q'],
      'k': ['k', 'c', 'q'],
      'c': ['c', 'k', 'q'],
      'u': ['u', 'v'],
      'v': ['v', 'u'],
      'f': ['f', 'ph'],
      'x': ['x', 'ks'],
      'j': ['j', 'y'],
      'y': ['y', 'j', 'i'],
      'p': ['p', 'b'],
      'b': ['b', 'p'],
      'm': ['m', 'nn'],
      'n': ['n', 'nn'],
      'r': ['r'],
      'l': ['l', 'll'],
      'd': ['d', 't'],
      'w': ['w', 'vv']
    };

    var original = window.BLOCKED_WORDS.slice();
    var variants = new Set(window.BLOCKED_WORDS);

    function addVariant(v) {
      if (v && v.length <= 80) variants.add(v);
    }

    original.forEach(function (word) {
      var base = String(word).toLocaleLowerCase().normalize('NFKC');
      if (!base) return;

      // Spatie-/streepjesvarianten.
      addVariant(base.replace(/\s+/g, ''));
      addVariant(base.replace(/\s+/g, '-'));
      addVariant(base.replace(/\s+/g, '_'));

      // Per letter maximaal 2 substitutierondes; dit levert veel varianten op
      // zonder de browser onnodig zwaar te belasten.
      var current = new Set([base]);
      for (var round = 0; round < 2; round++) {
        var next = new Set(current);
        current.forEach(function (value) {
          for (var i = 0; i < value.length; i++) {
            var ch = value[i];
            var choices = substitutions[ch] || [ch];
            choices.forEach(function (replacement) {
              if (replacement === ch) return;
              next.add(value.slice(0, i) + replacement + value.slice(i + 1));
            });
          }
        });
        current = next;
      }
      current.forEach(addVariant);

      // Veel voorkomende extra tikfouten: ontbrekende, dubbele of omgewisselde letter.
      for (var i = 0; i < base.length; i++) {
        addVariant(base.slice(0, i) + base.slice(i + 1));
        addVariant(base.slice(0, i) + base[i] + base.slice(i));
        if (i < base.length - 1) {
          addVariant(base.slice(0, i) + base[i + 1] + base[i] + base.slice(i + 2));
        }
      }
    });

    window.BLOCKED_WORDS = Array.from(variants);
  })();

  var ERROR_MESSAGE = 'Dit woord is niet toegestaan.';
  var lastAllowedValue = new WeakMap();
  var textFieldTypes = ['text', 'search', 'email', 'url', 'tel', 'password'];

  function isTextField(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
      return textFieldTypes.indexOf((el.type || 'text').toLowerCase()) !== -1;
    }
    return el.isContentEditable === true;
  }

  function clean(value) {
    return String(value || '')
      .normalize('NFKC')
      .toLocaleLowerCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, '')
  }

  function containsBlockedWord(value) {
    var text = clean(value);
    if (!text) return null;

    for (var i = 0; i < window.BLOCKED_WORDS.length; i++) {
      var blocked = clean(window.BLOCKED_WORDS[i]);
      if (!blocked) continue;

      // Woorden/zinnen worden als afzonderlijke woorden gecontroleerd.
      var escaped = blocked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var pattern = new RegExp('(^|[^\\p{L}\\p{N}_])' + escaped + '(?=$|[^\\p{L}\\p{N}_])', 'iu');

      if (pattern.test(text)) {
        return window.BLOCKED_WORDS[i];
      }
    }

    return null;
  }

  function getValue(el) {
    if (el.isContentEditable) return el.textContent || '';
    return el.value || '';
  }

  function setValue(el, value) {
    if (el.isContentEditable) {
      el.textContent = value;
    } else {
      el.value = value;
    }
  }

  function showBlockedMessage() {
    // Gebruik de standaard browserfoutmelding, zodat dit overal hetzelfde werkt.
    window.alert(ERROR_MESSAGE);
  }

  function rememberAllowed(el) {
    if (isTextField(el)) {
      lastAllowedValue.set(el, getValue(el));
    }
  }

  function proposedInputValue(el, event) {
    if (el.isContentEditable) {
      // beforeinput op contenteditable is lastiger exact te voorspellen;
      // de input-handler hieronder vangt het alsnog af.
      return null;
    }

    if (typeof el.selectionStart !== 'number' || typeof el.selectionEnd !== 'number') {
      return null;
    }

    var value = el.value || '';
    var start = el.selectionStart;
    var end = el.selectionEnd;

    if (event.inputType && event.inputType.indexOf('delete') === 0) {
      return value.slice(0, start) + value.slice(end);
    }

    var inserted = event.data || '';
    if (event.inputType === 'insertLineBreak') inserted = '\\n';

    return value.slice(0, start) + inserted + value.slice(end);
  }

  // Blokkeer het al vóórdat tekst wordt ingevoerd.
  document.addEventListener('beforeinput', function (event) {
    var el = event.target;
    if (!isTextField(el)) return;

    var value = proposedInputValue(el, event);
    if (value !== null && containsBlockedWord(value)) {
      event.preventDefault();
      showBlockedMessage();
    }
  }, true);

  // Plakken blokkeren.
  document.addEventListener('paste', function (event) {
    var el = event.target;
    if (!isTextField(el)) return;

    var pasted = (event.clipboardData || window.clipboardData).getData('text') || '';
    var value = proposedInputValue(el, { data: pasted, inputType: 'insertText' });

    if ((value !== null && containsBlockedWord(value)) || (value === null && containsBlockedWord((getValue(el) || '') + pasted))) {
      event.preventDefault();
      showBlockedMessage();
    }
  }, true);

  // Tekst slepen/neerzetten blokkeren.
  document.addEventListener('drop', function (event) {
    var el = event.target;
    if (!isTextField(el)) return;

    var dropped = event.dataTransfer ? event.dataTransfer.getData('text') : '';
    var value = proposedInputValue(el, { data: dropped, inputType: 'insertText' });

    if ((value !== null && containsBlockedWord(value)) || (value === null && containsBlockedWord((getValue(el) || '') + dropped))) {
      event.preventDefault();
      showBlockedMessage();
    }
  }, true);

  // Fallback voor browsers/frameworks die de waarde rechtstreeks aanpassen.
  document.addEventListener('focusin', function (event) {
    rememberAllowed(event.target);
  }, true);

  document.addEventListener('input', function (event) {
    var el = event.target;
    if (!isTextField(el)) return;

    var value = getValue(el);
    if (containsBlockedWord(value)) {
      var previous = lastAllowedValue.get(el);
      if (previous === undefined) previous = '';

      setValue(el, previous);

      // Laat frameworks zoals React/Vue/etc. weten dat de waarde is teruggezet.
      try {
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (_) {}

      showBlockedMessage();
      return;
    }

    lastAllowedValue.set(el, value);
  }, true);

  // Extra controle voor formulieren die de waarde programmatisch wijzigen.
  document.addEventListener('change', function (event) {
    var el = event.target;
    if (!isTextField(el)) return;

    var value = getValue(el);
    if (containsBlockedWord(value)) {
      var previous = lastAllowedValue.get(el);
      setValue(el, previous === undefined ? '' : previous);
      showBlockedMessage();
    } else {
      lastAllowedValue.set(el, value);
    }
  }, true);

  // Maak de controle ook beschikbaar voor bestaande scripts.
  window.containsBlockedWord = containsBlockedWord;
})();
