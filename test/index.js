'use strict';

var legacyLog = require('../');
var Log = legacyLog.Log;

// Helper for testing stdout
var hooker = require('hooker');
function stdoutEqual(test, callback, expected) {
  var actual = '';
  // Hook process.stdout.write
  hooker.hook(process.stdout, 'write', {
    // This gets executed before the original process.stdout.write.
    pre: function(result) {
      // Concatenate uncolored result onto actual.
      actual += legacyLog.uncolor(result);
      // Prevent the original process.stdout.write from executing.
      return hooker.preempt();
    },
  });
  // Execute the logging code to be tested.
  callback();
  // Restore process.stdout.write to its original value.
  stdoutUnmute();
  // Actually test the actually-logged stdout string to the expected value.
  test.equal(actual, expected);
}

// Outright mute stdout.
function stdoutMute() {
  hooker.hook(process.stdout, 'write', {
    pre: function() {
      return hooker.preempt();
    },
  });
}

// Unmute stdout.
function stdoutUnmute() {
  hooker.unhook(process.stdout, 'write');
}

// Helper function: repeat('a', 3) -> 'aaa', repeat('a', 3, '-') -> 'a-a-a'
function repeat(str, n, separator) {
  var result = str;
  for (var i = 1; i < n; i++) {
    result += (separator || '') + str;
  }
  return result;
}

var fooBuffer = new Buffer('foo');

exports['Log instance'] = {
  setUp: function(done) {
    this.grunt = {fail: {errorcount: 0}};
    done();
  },
  'write': function(test) {
    test.expect(4);
    var log = new Log();

    stdoutEqual(test, function() { log.write(''); }, '');
    stdoutEqual(test, function() { log.write('foo'); }, 'foo');
    stdoutEqual(test, function() { log.write('%s', 'foo'); }, 'foo');
    stdoutEqual(test, function() { log.write(fooBuffer); }, 'foo');

    test.done();
  },
  'writeln': function(test) {
    test.expect(4);
    var log = new Log();

    stdoutEqual(test, function() { log.writeln(); }, '\n');
    stdoutEqual(test, function() { log.writeln('foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.writeln('%s', 'foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.writeln(fooBuffer); }, 'foo\n');

    test.done();
  },
  'warn': function(test) {
    test.expect(5);
    var log = new Log({grunt: this.grunt});

    stdoutEqual(test, function() { log.warn(); }, 'ERROR\n');
    stdoutEqual(test, function() { log.warn('foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.warn('%s', 'foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.warn(fooBuffer); }, '>> foo\n');
    test.equal(this.grunt.fail.errorcount, 0);

    test.done();
  },
  'error': function(test) {
    test.expect(5);
    var log = new Log({grunt: this.grunt});

    stdoutEqual(test, function() { log.error(); }, 'ERROR\n');
    stdoutEqual(test, function() { log.error('foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.error('%s', 'foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.error(fooBuffer); }, '>> foo\n');
    test.equal(this.grunt.fail.errorcount, 4);

    test.done();
  },
  'ok': function(test) {
    test.expect(4);
    var log = new Log({grunt: this.grunt});

    stdoutEqual(test, function() { log.ok(); }, 'OK\n');
    stdoutEqual(test, function() { log.ok('foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.ok('%s', 'foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.ok(fooBuffer); }, '>> foo\n');

    test.done();
  },
  'errorlns': function(test) {
    test.expect(2);
    var log = new Log({grunt: this.grunt});

    stdoutEqual(test, function() {
      log.errorlns(repeat('foo', 30, ' '));
    }, '>> ' + repeat('foo', 19, ' ') + '\n' +
      '>> ' + repeat('foo', 11, ' ') + '\n');
    test.equal(this.grunt.fail.errorcount, 1);

    test.done();
  },
  'oklns': function(test) {
    test.expect(1);
    var log = new Log();

    stdoutEqual(test, function() {
      log.oklns(repeat('foo', 30, ' '));
    }, '>> ' + repeat('foo', 19, ' ') + '\n' +
      '>> ' + repeat('foo', 11, ' ') + '\n');

    test.done();
  },
  'success': function(test) {
    test.expect(4);
    var log = new Log();

    stdoutEqual(test, function() { log.success(); }, '\n');
    stdoutEqual(test, function() { log.success('foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.success('%s', 'foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.success(fooBuffer); }, 'foo\n');

    test.done();
  },
  'fail': function(test) {
    test.expect(4);
    var log = new Log();

    stdoutEqual(test, function() { log.fail(); }, '\n');
    stdoutEqual(test, function() { log.fail('foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.fail('%s', 'foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.fail(fooBuffer); }, 'foo\n');

    test.done();
  },
  'header': function(test) {
    test.expect(5);
    var log = new Log();

    stdoutEqual(test, function() { log.header(); }, '\n');
    stdoutEqual(test, function() { log.header(); }, '\n\n');
    stdoutEqual(test, function() { log.header('foo'); }, '\nfoo\n');
    stdoutEqual(test, function() { log.header('%s', 'foo'); }, '\nfoo\n');
    stdoutEqual(test, function() { log.header(fooBuffer); }, '\nfoo\n');

    test.done();
  },
  'subhead': function(test) {
    test.expect(5);
    var log = new Log();

    stdoutEqual(test, function() { log.subhead(); }, '\n');
    stdoutEqual(test, function() { log.subhead(); }, '\n\n');
    stdoutEqual(test, function() { log.subhead('foo'); }, '\nfoo\n');
    stdoutEqual(test, function() { log.subhead('%s', 'foo'); }, '\nfoo\n');
    stdoutEqual(test, function() { log.subhead(fooBuffer); }, '\nfoo\n');

    test.done();
  },
  'options.debug = true': function(test) {
    test.expect(4);
    var log = new Log({debug: true});

    stdoutEqual(test, function() { log.debug(); }, '[D] \n');
    stdoutEqual(test, function() { log.debug('foo'); }, '[D] foo\n');
    stdoutEqual(test, function() { log.debug('%s', 'foo'); }, '[D] foo\n');
    stdoutEqual(test, function() { log.debug(fooBuffer); }, '[D] foo\n');

    test.done();
  },
  'options.debug = false': function(test) {
    test.expect(1);
    var log = new Log({debug: false});

    stdoutEqual(test, function() { log.debug('foo'); }, '');

    test.done();
  },
  'writetableln': function(test) {
    test.expect(1);
    var log = new Log();

    stdoutEqual(test, function() {
      log.writetableln([10], [repeat('foo', 10)]);
    }, 'foofoofoof\noofoofoofo\nofoofoofoo\n');

    test.done();
  },
  'writelns': function(test) {
    test.expect(1);
    var log = new Log();

    stdoutEqual(test, function() {
      log.writelns(repeat('foo', 30, ' '));
    }, repeat('foo', 20, ' ') + '\n' +
      repeat('foo', 10, ' ') + '\n');

    test.done();
  },
  'writeflags': function(test) {
    test.expect(1);
    var log = new Log();

    stdoutEqual(test, function() {
      log.writeflags(['foo', 'bar'], 'test');
    }, 'test: foo, bar\n');

    test.done();
  },
  'always': function(test) {
    test.expect(3);
    var log = new Log();

    test.strictEqual(log.always, log);
    test.strictEqual(log.verbose.always, log);
    test.strictEqual(log.notverbose.always, log);

    test.done();
  },
  'or': function(test) {
    test.expect(2);
    var log = new Log();

    test.strictEqual(log.verbose.or, log.notverbose);
    test.strictEqual(log.notverbose.or, log.verbose);

    test.done();
  },
  'hasLogged': function(test) {
    // Should only be true if output has been written!
    test.expect(24);
    var log = new Log();
    test.equal(log.hasLogged, false);
    test.equal(log.verbose.hasLogged, false);
    test.equal(log.notverbose.hasLogged, false);
    log.write('');
    test.equal(log.hasLogged, true);
    test.equal(log.verbose.hasLogged, true);
    test.equal(log.notverbose.hasLogged, true);

    log = new Log({verbose: true});
    log.verbose.write('');
    test.equal(log.hasLogged, true);
    test.equal(log.verbose.hasLogged, true);
    test.equal(log.notverbose.hasLogged, true);

    log = new Log();
    log.notverbose.write('');
    test.equal(log.hasLogged, true);
    test.equal(log.verbose.hasLogged, true);
    test.equal(log.notverbose.hasLogged, true);

    stdoutMute();
    log = new Log({debug: true});
    log.debug('');
    test.equal(log.hasLogged, true);
    test.equal(log.verbose.hasLogged, true);
    test.equal(log.notverbose.hasLogged, true);
    stdoutUnmute();

    // The following should be false since there's a verbose mismatch!
    log = new Log();
    log.verbose.write('');
    test.equal(log.hasLogged, false);
    test.equal(log.verbose.hasLogged, false);
    test.equal(log.notverbose.hasLogged, false);

    log = new Log({verbose: true});
    log.notverbose.write('');
    test.equal(log.hasLogged, false);
    test.equal(log.verbose.hasLogged, false);
    test.equal(log.notverbose.hasLogged, false);

    // The following should be false since there's a debug mismatch!
    log = new Log();
    log.debug('');
    test.equal(log.hasLogged, false);
    test.equal(log.verbose.hasLogged, false);
    test.equal(log.notverbose.hasLogged, false);

    test.done();
  },
  'muted': function(test) {
    test.expect(30);
    var log = new Log();

    test.equal(log.muted, false);
    test.equal(log.verbose.muted, false);
    test.equal(log.notverbose.muted, false);
    test.equal(log.options.muted, false);
    test.equal(log.verbose.options.muted, false);
    test.equal(log.notverbose.options.muted, false);

    log.muted = true;
    test.equal(log.muted, true);
    test.equal(log.verbose.muted, true);
    test.equal(log.notverbose.muted, true);
    test.equal(log.options.muted, true);
    test.equal(log.verbose.options.muted, true);
    test.equal(log.notverbose.options.muted, true);

    log.muted = false;
    test.equal(log.muted, false);
    test.equal(log.verbose.muted, false);
    test.equal(log.notverbose.muted, false);
    test.equal(log.options.muted, false);
    test.equal(log.verbose.options.muted, false);
    test.equal(log.notverbose.options.muted, false);

    log.options.muted = true;
    test.equal(log.muted, true);
    test.equal(log.verbose.muted, true);
    test.equal(log.notverbose.muted, true);
    test.equal(log.options.muted, true);
    test.equal(log.verbose.options.muted, true);
    test.equal(log.notverbose.options.muted, true);

    log.options.muted = false;
    test.equal(log.muted, false);
    test.equal(log.verbose.muted, false);
    test.equal(log.notverbose.muted, false);
    test.equal(log.options.muted, false);
    test.equal(log.verbose.options.muted, false);
    test.equal(log.notverbose.options.muted, false);

    test.done();
  },
  'verbose': function(test) {
    test.expect(15);
    var log = new Log();
    log.muted = true;

    // Test verbose methods to make sure they always return the verbose object.
    test.strictEqual(log.verbose.write(''), log.verbose);
    test.strictEqual(log.verbose.writeln(''), log.verbose);
    test.strictEqual(log.verbose.warn(''), log.verbose);
    test.strictEqual(log.verbose.error(''), log.verbose);
    test.strictEqual(log.verbose.ok(''), log.verbose);
    test.strictEqual(log.verbose.errorlns(''), log.verbose);
    test.strictEqual(log.verbose.oklns(''), log.verbose);
    test.strictEqual(log.verbose.success(''), log.verbose);
    test.strictEqual(log.verbose.fail(''), log.verbose);
    test.strictEqual(log.verbose.header(''), log.verbose);
    test.strictEqual(log.verbose.subhead(''), log.verbose);
    test.strictEqual(log.verbose.debug(''), log.verbose);
    test.strictEqual(log.verbose.writetableln([]), log.verbose);
    test.strictEqual(log.verbose.writelns(''), log.verbose);
    test.strictEqual(log.verbose.writeflags([]), log.verbose);

    test.done();
  },
  'notverbose': function(test) {
    test.expect(15);
    var log = new Log();
    log.muted = true;

    // Test notverbose methods to make sure they always return the notverbose object.
    test.strictEqual(log.notverbose.write(''), log.notverbose);
    test.strictEqual(log.notverbose.writeln(''), log.notverbose);
    test.strictEqual(log.notverbose.warn(''), log.notverbose);
    test.strictEqual(log.notverbose.error(''), log.notverbose);
    test.strictEqual(log.notverbose.ok(''), log.notverbose);
    test.strictEqual(log.notverbose.errorlns(''), log.notverbose);
    test.strictEqual(log.notverbose.oklns(''), log.notverbose);
    test.strictEqual(log.notverbose.success(''), log.notverbose);
    test.strictEqual(log.notverbose.fail(''), log.notverbose);
    test.strictEqual(log.notverbose.header(''), log.notverbose);
    test.strictEqual(log.notverbose.subhead(''), log.notverbose);
    test.strictEqual(log.notverbose.debug(''), log.notverbose);
    test.strictEqual(log.notverbose.writetableln([]), log.notverbose);
    test.strictEqual(log.notverbose.writelns(''), log.notverbose);
    test.strictEqual(log.notverbose.writeflags([]), log.notverbose);

    test.done();
  },
};

exports['Helpers'] = {
  setUp: function(done) {
    done();
  },
  'uncolor': function(test) {
    test.expect(2);
    var log = new Log();

    test.strictEqual(log.uncolor, legacyLog.uncolor);
    test.equal(legacyLog.uncolor('a'.red + 'b'.bold.green + 'c'.blue.underline), 'abc');

    test.done();
  },
  'wordlist': function(test) {
    test.expect(3);
    var log = new Log();

    test.strictEqual(log.wordlist, legacyLog.wordlist);
    test.equal(legacyLog.uncolor(legacyLog.wordlist(['a', 'b'])), 'a, b');
    test.equal(legacyLog.uncolor(legacyLog.wordlist(['a', 'b'], {separator: '-'})), 'a-b');

    test.done();
  },
  'wraptext': function(test) {
    test.expect(9);
    var log = new Log();

    // // I'm not writing out comprehensive unit tests for this right now.
    // function doAll(text) {
    //   console.log('==========');
    //   console.log('==========');
    //   [4, 6, 10, 15, 20, 25, 30, 40, 60].forEach(function(n) {
    //     doOne(n, text);
    //   });
    // }
    // function doOne(n, text) {
    //   console.log(new Array(n + 1).join('-'));
    //   console.log(legacyLog.wraptext(n, text));
    // }
    // var text = 'this is '.red + 'a simple'.yellow.inverse + ' test of'.green + ' ' + 'some wrapped'.blue + ' text over '.inverse.magenta + 'many lines'.red;
    // doAll(text);
    // text = 'foolish '.red.inverse + 'monkeys'.yellow + ' eating'.green + ' ' + 'delicious'.inverse.blue + ' bananas '.magenta + 'forever'.red;
    // doAll(text);
    // text = 'foolish monkeys eating delicious bananas forever'.rainbow;
    // doAll(text);

    test.strictEqual(log.wraptext, legacyLog.wraptext);
    test.equal(legacyLog.wraptext(2, 'aabbc'), 'aa\nbb\nc');
    test.equal(legacyLog.wraptext(2, 'aabbcc'), 'aa\nbb\ncc');
    test.equal(legacyLog.wraptext(3, 'aaabbbc'), 'aaa\nbbb\nc');
    test.equal(legacyLog.wraptext(3, 'aaabbbcc'), 'aaa\nbbb\ncc');
    test.equal(legacyLog.wraptext(3, 'aaabbbccc'), 'aaa\nbbb\nccc');
    test.equal(legacyLog.uncolor(legacyLog.wraptext(3, 'aaa'.blue + 'bbb'.green + 'c'.underline)), 'aaa\nbbb\nc');
    test.equal(legacyLog.uncolor(legacyLog.wraptext(3, 'aaa'.blue + 'bbb'.green + 'cc'.underline)), 'aaa\nbbb\ncc');
    test.equal(legacyLog.uncolor(legacyLog.wraptext(3, 'aaa'.blue + 'bbb'.green + 'ccc'.underline)), 'aaa\nbbb\nccc');

    test.done();
  },
  'table': function(test) {
    test.expect(2);
    var log = new Log();

    test.strictEqual(log.table, legacyLog.table);
    test.equal(legacyLog.table([3, 1, 5, 1, 8, 1, 12, 1, 20], [
      'a aa aaa aaaa aaaaa',
      '|||||||',
      'b bb bbb bbbb bbbbb',
      '|||||||',
      'c cc ccc cccc ccccc',
      '|||||||',
      'd dd ddd dddd ddddd',
      '|||||||',
      'e ee eee eeee eeeee eeeeee',
    ]), 'a  |b bb |c cc ccc|d dd ddd    |e ee eee eeee eeeee \n' +
        'aa |bbb  |cccc    |dddd ddddd  |eeeeee              \n' +
        'aaa|bbbb |ccccc   |            |\n' +
        'aaa|bbbbb|        |            |\n' +
        'a  |     |        |            |\n' +
        'aaa|     |        |            |\n' +
        'aa |     |        |            |');
    test.done();
  },
};
