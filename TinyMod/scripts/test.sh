# enable globstar for recursive globbing
shopt -s globstar
# enable extglob for extended globbing
shopt -s extglob

# copy all js files into test.js, first add TinyMod then the current mod files
cd dist/built || exit
cat TinyMod/**/*.js !(TinyMod)/**/*.js *.js > ../../test.js
cd ../..

# fix test.js script so we can paste it in the console
sed -i 's#export##g' test.js
sed -i 's#import#//#g' test.js
sed -i 's#class \(\w\w*\) {#\1 = class {#g' test.js
sed -i 's#class \(\w\w*\) extends#\1 = class extends#g' test.js

{ echo "(function(){let style = \`<style>"; cat "${1}"/styles/*.css ; echo "</style>\`;"; echo "document.head.insertAdjacentHTML('beforeend', style);})();";} > test.css.js