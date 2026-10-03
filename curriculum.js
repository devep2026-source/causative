/* curriculum.js · single source of truth shared by index / aula / taller — ES5.
   sections  -> how progress is measured per section of the lesson
   activities-> the green classroom cards (teacher-led, moved out of index.html)
   bank      -> extra activities the teacher can assign (auto suggestions) */
(function (w) {
  'use strict';

  var sections = [
    {
      id: 'l1', nav: '#l1', badge: 'Floor 1 · Remember · Guest', title: 'The Guest List',
      quiz: { '1': 3 }, flags: []
    },
    {
      id: 'l2', nav: '#l2', badge: 'Floor 2 · Understand · Member', title: 'Who really does it?',
      quiz: { '2': 5 }, flags: []
    },
    {
      id: 'l3', nav: '#l3', badge: 'Floor 3 · Apply · Manager', title: 'Give the orders',
      quiz: { '3': 7 }, flags: []
    },
    {
      id: 'l4', nav: '#l4', badge: 'Floor 4 · Analyze · Executive', title: 'Error Hunters',
      quiz: { '4': 4, '42': 3 }, flags: []
    },
    {
      id: 'l5', nav: '#l5', badge: 'Floor 5 · Evaluate · Director', title: 'The Judge',
      quiz: { '5': 4, '52': 3 }, flags: []
    },
    {
      id: 'l6', nav: '#l6', badge: 'Floor 6 · Create · The Boss', title: 'Your VIP Day',
      quiz: {}, flags: ['6']
    },
    {
      id: 'p2', nav: '#p2', badge: 'Part 2 · Real conversations', title: 'The Conversation Room',
      quiz: { '71': 4, '72': 4, '73': 3, '74': 3, '75': 5 }, flags: ['c6']
    },
    {
      id: 'p3', nav: '#p3', badge: 'Part 3 · Practice until it is automatic', title: 'The Construction Gym',
      quiz: {}, flags: [], items: { 'bd.b2': 5, 'bd.b3': 6, 'pr': 7, 'om': 1 }
    },
    {
      id: 'twist', nav: '#twist', badge: 'Bonus · Plot twist', title: 'You are a VIP too',
      quiz: {}, flags: [], counter: { key: 'tw', total: 6 }
    }
  ];

  /* the seven green classroom cards, exactly as they were in index.html */
  var activities = [
    {
      section: 'l1', min: 5, title: '🎯 ACTIVITY · MEMORY RELAY · 5 MIN',
      html: '<ol><li>Groups of 4. Study the flip cards for 2 minutes.</li><li>Teacher calls a verb (for example <i>get</i>).</li><li>Student 1 writes the formula on the board, student 2 adds an example, student 3 says it aloud.</li><li>1 point per correct step. Students rotate.</li></ol>'
    },
    {
      section: 'l2', min: 6, title: '🎯 ACTIVITY · POWER CHARADES · 6 MIN',
      html: '<ol><li>Groups of 4: 1 VIP, 3 Staff. Roles rotate each round.</li><li>VIP draws a power card (let, have, get, make) and says an order with that verb.</li><li>Staff react: they cheer for <i>let</i>, complain dramatically for <i>make</i>.</li><li>The group scores 1 point when the reaction matches the verb.</li></ol>'
    },
    {
      section: 'l3', min: 8, title: '🎯 ACTIVITY · SERVICE DESK · 8 MIN',
      html: '<ol><li>Prepare cards: barber, mechanic, dentist, chef, painter, tailor.</li><li>VIP draws a card and announces a need: <i>I need to get my teeth cleaned!</i></li><li>Staff mime the service. If the VIP used the structure well, the group scores.</li><li>Extra: each student writes 3 orders using person + verb and 3 using thing + participle.</li></ol>'
    },
    {
      section: 'l4', min: 8, title: '🎯 ACTIVITY · ERROR HUNTERS BATTLE · 8 MIN',
      html: '<ol><li>Teams get 6 wrong sentences. First hand up must explain <i>why</i> it is wrong.</li><li>Correct + correct reason = 2 points. Only the correction = 1 point.</li><li>Round 2: each team writes one wrong sentence and passes it to another team to fix.</li><li>Winner: the team with the trickiest error that was still fixed.</li></ol>'
    },
    {
      section: 'l5', min: 8, title: "🎯 ACTIVITY · JUDGE'S COURT · 8 MIN",
      html: '<ol><li>Teacher reads a scenario card.</li><li>Each group shows a green paddle (best sentence) or a red one (weak sentence) and defends it in one sentence.</li><li>The Judge (rotating student) gives a verdict using the four criteria.</li><li>1 point for the best-argued defense.</li></ol>'
    },
    {
      section: 'l6', min: 15, title: '🎯 ACTIVITY · VIP DAY PITCH · 15 MIN',
      html: "<ol><li>Write your VIP's day with the five ingredients (10 min).</li><li>Use the checker and the self-check list to fix your text.</li><li>Read it aloud as a pitch (30 seconds).</li><li>Class votes two awards: <i>Most Powerful Boss</i> and <i>Most Polite Boss</i>.</li></ol>"
    },
    {
      section: 'twist', min: 6, title: '🎯 ACTIVITY · BOSS INTERVIEW · 6 MIN',
      html: '<ol><li>Pairs. Ask each other: <i>What did you get someone to do this week?</i></li><li>Answer with a causative: <i>I got my sister to…</i></li><li>Change roles, then tell the class one surprising answer about your partner.</li></ol>'
    }
  ];

  /* extra activities: tag each one with the weak points it repairs */
  var bank = {
    l1: [
      { title: 'Six verbs, six cards', tags: ['have', 'get', 'make', 'let'],
        body: '<p>Write one true sentence for each verb: <b>have, get, make, let, help, force</b>. Then underline what comes after the verb: a <b>person</b> (base verb / to + verb) or a <b>thing</b> (past participle).</p><p class="ex">I <b>had</b> my phone <b>repaired</b>. (thing → participle)</p>' },
      { title: 'Person or thing?', tags: ['thing', 'participle'],
        body: '<p>Sort these into PERSON or THING, then build a causative for each: <i>my hair, the mechanic, her homework, the dentist, my brother, the car</i>.</p><p>Minimum: 3 with a person, 3 with a thing.</p>' },
      { title: 'Golden rule drill', tags: ['get', 'to'],
        body: '<p>Correct these 5 sentences and say why:</p><ol><li>I got my dad helped me.</li><li>She had her assistant to send it.</li><li>My mom made me to clean.</li><li>They let me to go.</li><li>I forced my brother carried the boxes.</li></ol>' }
    ],
    l2: [
      { title: 'Who really does it?', tags: ['have', 'get', 'make'],
        body: '<p>For each situation choose the right verb (<b>have / get / make / let</b>) and say who does the action:</p><ol><li>Your boss ___ you work late.</li><li>Your friend ___ you his notes.</li><li>You ___ your hair cut every month.</li><li>The coach ___ us run.</li></ol>' },
      { title: 'Tense switch', tags: ['tense'],
        body: '<p>Rewrite these in three tenses (present, past, future with <i>going to</i>):</p><ol><li>I have my car cleaned.</li><li>She gets her nails done.</li></ol>' },
      { title: 'Power meter write-up', tags: ['let', 'help', 'force'],
        body: '<p>Write 6 orders, one per level of power, from softest to strongest: <b>let → help → have → get → make → force</b>. One sentence each.</p>' }
    ],
    l3: [
      { title: 'Service desk vocabulary', tags: ['thing', 'participle'],
        body: '<p>Build 6 requests with a <b>thing + past participle</b> for: haircut, teeth, car, phone, homework, taxes.</p><p class="ex">I need to get my teeth <b>cleaned</b>.</p>' },
      { title: 'Person + base verb', tags: ['person', 'make', 'get'],
        body: '<p>Build 6 orders with a <b>person + base verb / to + verb</b>: your brother, the waiter, your partner, the class, your assistant, your team.</p>' },
      { title: 'Polite or bossy', tags: ['polite'],
        body: '<p>Rewrite each order as a polite request (Would you mind…? / Could you…? / I’d rather…):</p><ol><li>Clean this.</li><li>Do it now.</li><li>Send the file.</li></ol>' }
    ],
    l4: [
      { title: 'Error hunt round', tags: ['make', 'let', 'get'],
        body: '<p>Write 4 wrong sentences (with the trap: <i>to</i> after make/let, thing + base verb, get without <i>to</i>). Swap with a classmate and fix them.</p>' },
      { title: 'Why this verb?', tags: ['have', 'get'],
        body: '<p>Explain in one line why each is wrong: <i>She had me to call him. / I made my car washed. / My dad got me cleaned the room.</i></p>' },
      { title: 'Pattern compare', tags: ['participle', 'thing'],
        body: '<p>Write 3 pairs: same idea with <b>have</b> and with <b>get</b>. Then explain the difference in register (formal / informal).</p>' }
    ],
    l5: [
      { title: 'Defense sheet', tags: ['criteria'],
        body: '<p>Take 3 weak sentences and defend the best one using the four criteria: correct formula, right verb, right tense, natural meaning.</p>' },
      { title: 'Verdict practice', tags: ['make', 'let'],
        body: '<p>Give a verdict (accept / reject + reason) for 5 causatives written by a classmate. Use: <i>Because + person/thing + verb form…</i></p>' },
      { title: 'Half-time quiz repair', tags: ['repair'],
        body: '<p>Re-do the questions you missed in this floor, this time writing the rule next to each answer.</p>' }
    ],
    l6: [
      { title: 'VIP day, five ingredients', tags: ['story'],
        body: '<p>Write your VIP day again with at least <b>5 causatives</b>: have, get, make, let + one of help/force. Then run the checker.</p>' },
      { title: 'Missing verb challenge', tags: ['have', 'get', 'make', 'let'],
        body: '<p>In your VIP day text, force yourself to use each of the four main verbs <b>at least once</b>. Highlight them in a different colour.</p>' },
      { title: 'Pitch + feedback', tags: ['story'],
        body: '<p>Read your VIP day aloud as a 30-second pitch. A classmate counts your causatives and marks one sentence to improve.</p>' }
    ],
    p2: [
      { title: 'Three causatives + one polite line', tags: ['polite'],
        body: '<p>Write a short conversation (8–10 lines) with at least <b>3 causatives</b> and <b>2 polite responses</b>. Run the checker.</p>' },
      { title: 'Pressure check', tags: ['make', 'excessive'],
        body: '<p>Rewrite each line so it is neither excessive nor too soft:</p><ol><li>You must do this! (make)</li><li>Could you maybe help me? (get)</li></ol>' },
      { title: 'Reply fast', tags: ['reply'],
        body: '<p>Partner A says a request. Partner B answers in under 5 seconds with a causative + a polite word. 6 rounds each.</p>' }
    ],
    p3: [
      { title: 'Builder marathon', tags: ['builder'],
        body: '<p>Complete Stages 2 and 3 without hints (Stage 3 first). If a builder is already green, rebuild it with your own words.</p>' },
      { title: 'Occasion machine x5', tags: ['occasion'],
        body: '<p>Answer 5 occasions from the machine with a full causative sentence. If you miss, write the correct sentence in your notebook.</p>' },
      { title: 'Model to own', tags: ['pr'],
        body: '<p>Take 3 model sentences from Stage 1 and change the subject, the tense and the verb — keep the same structure.</p>' }
    ],
    twist: [
      { title: 'My real week', tags: ['real'],
        body: '<p>Write 5 true sentences about last week using the causative: what did you make/get/have/let someone do?</p>' },
      { title: 'Interview follow-up', tags: ['real'],
        body: '<p>Ask one person at home: “What did you get someone to do this week?” Write their answer with your correction, if needed.</p>' }
    ]
  };

  /* ---------- progress maths ---------- */
  function inList(str, key) {
    if (!str) return false;
    return (',' + str + ',').indexOf(',' + key + ',') > -1;
  }

  function stats(sec, st) {
    var done = 0, total = 0, wrong = 0, i, k, f;
    st = st || {};
    if (sec.quiz) {
      for (f in sec.quiz) {
        if (!sec.quiz.hasOwnProperty(f)) continue;
        var qTotal = sec.quiz[f];
        total += qTotal;
        for (i = 0; i < qTotal; i++) {
          if (st['q.' + f + '.' + i] === '1') done++;
          var miss = parseInt(st['w.' + f + '.' + i], 10);
          if (miss > 0) wrong += miss;
        }
      }
    }
    if (sec.flags) {
      for (i = 0; i < sec.flags.length; i++) {
        total += 1;
        if (inList(st.done, sec.flags[i])) done++;
      }
    }
    if (sec.items) {
      for (k in sec.items) {
        if (!sec.items.hasOwnProperty(k)) continue;
        total += sec.items[k];
        if (k === 'om') { if (st.om === '1') done += 1; }
        else {
          for (i = 0; i < sec.items[k]; i++) if (st[k + '.' + i] === '1') done++;
        }
      }
    }
    if (sec.counter) {
      total += sec.counter.total;
      var c = parseInt(st[sec.counter.key], 10) || 0;
      done += c > sec.counter.total ? sec.counter.total : c;
    }
    return { done: done, total: total, pct: total ? Math.round(done * 100 / total) : 0, wrong: wrong };
  }

  function overall(st) {
    var done = 0, total = 0, wrong = 0, i;
    for (i = 0; i < sections.length; i++) {
      var s = stats(sections[i], st);
      done += s.done; total += s.total; wrong += s.wrong;
    }
    return { done: done, total: total, wrong: wrong, pct: total ? Math.round(done * 100 / total) : 0 };
  }

  /* weakest section first, ignoring sections never touched */
  function weakest(st, n) {
    var rows = [], i;
    for (i = 0; i < sections.length; i++) {
      var s = stats(sections[i], st);
      if (!s.done && !s.wrong) continue;
      rows.push({ sec: sections[i], s: s });
    }
    rows.sort(function (a, b) {
      if (a.s.wrong !== b.s.wrong) return b.s.wrong - a.s.wrong;
      return a.s.pct - b.s.pct;
    });
    return rows.slice(0, n || 3);
  }

  /* which floor badge an assignment belongs to */
  function sectionById(id) {
    var i;
    for (i = 0; i < sections.length; i++) if (sections[i].id === id) return sections[i];
    return null;
  }

  w.Curriculum = {
    sections: sections,
    activities: activities,
    bank: bank,
    stats: stats,
    overall: overall,
    weakest: weakest,
    sectionById: sectionById,
    inList: inList
  };
})(window);
