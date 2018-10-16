const html = `<div style="background: transparent; background-image: none!important">
    $css
		<div style="background: white">
		$body
		</div>
</div>`;

function formatOne(text, publicPath) {
  if (!text) {
    return text;
  }

  text = text.trim();

  if (text[0] === '{' || text[0] === '[' || text.startsWith('Object {')) {
    try {
      // create object and remove trailing comma
      text = text.replace(/Object \{/g, '{');
      text = text.replace(/Array \[/g, '[');
    } catch (ex) {
      console.log(ex);
    } finally {
      return text;
    }
  }

  return null;
}

function formatSnapshot(ss) {
  let snapshots = '';
  let key = '';
  debugger;

  if (typeof ss == 'string') {
    let one = formatOne(ss, '');
    if (one) {
      return one;
    } else {
      text = ss;
    }
  } else {
    for (let key of Object.getOwnPropertyNames(ss)) {
      // remove snapshots that are not in this test

      let text = formatOne(ss[key], '');

      snapshots += `
          <div class="ui fluid label">${key.replace(/ 1$/, '')}</div>
          <div class="${ss.cssClassName}" style="padding: 6px">${
        ss.decorator ? ss.decorator.replace('$snapshot', text) : text
      }</div>`;
    }
  }

  // console.log(snapshots);
  let sBody = snapshots.replace(/className/g, 'class');
  sBody = toStyleTag(sBody);
  // handle self closing tags
  sBody = sBody.replace(/<\s*([^\s>]+)([^>]*)\/\s*>/g, '<$1$2></$1>');
  // handle object values
  sBody = sBody.replace(/=\{true\}/g, '');
  sBody = sBody.replace(/=\{false\}/g, '__never');
  sBody = sBody.replace(/=\{([\d\.]*)\}/g, '="$1"');

  let result = html.replace(
    '$body',
    `<div style="padding: 6px">
					${sBody}
			</div>`
  );

  // retplace style
  // const css: string = vscode.workspace.getConfiguration('snapshots').get('css') || '';
  result = result.replace('$css', '');

  return result;
}

let reg = /style=\{\n.*Object (\{[^\}]*\})\n.*\}/g;
function toStyleTag(styleTag) {
  try {
    let g = styleTag.replace(reg, function(m, n) {
      // remove trailing comma
      n = n.replace(/,\n.*\}/, '}');
      let o = JSON.parse(n);

      let values = Object.keys(o).reduce(function(accumulator, currentValue) {
        let m = currentValue.replace(/([A-Z])/g, (v, g) => '-' + g.toLowerCase());
        return accumulator + m + ': ' + o[currentValue] + '; ';
      }, '');
      return `style="${values}"`;
    });
    return g;
  } catch (ex) {
    console.error(ex);
    return styleTag;
  }
}

module.exports.formatSnapshot = formatSnapshot;
