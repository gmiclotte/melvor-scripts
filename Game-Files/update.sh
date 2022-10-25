# directory in the repo that we are interested in
parent="melvor"
dir="${parent}/assets/js/"

# clean up
rm -rf game built lib src

# download game files through git, clean up afterwards
git init
git remote add -f origin git@github.com:gmiclotte/melvoridle.com.git
git config core.sparseCheckout true
echo ${dir} >> .git/info/sparse-checkout
echo ${parent}/version >> .git/info/sparse-checkout
git pull origin master
rm -rf .git

# remove unnecessary directory nesting
mv ${dir}/* .
mv ${parent}/version .
rm -r ${parent}
mkdir lib
mv *.js lib

# enable globstar for recursive globbing
shopt -s globstar

# add exports
sed -i 's/^class/export class/g' ./**/*.js
sed -i 's/^function/export function/g' ./**/*.js
sed -i 's/^const/export const/g' ./**/*.js


# download game types through git, clean up afterwards
git init
git remote add -f origin git@github.com:coolrox95/Melvor-Typing-Project.git
git config core.sparseCheckout true
echo "src" >> .git/info/sparse-checkout
git pull origin main
rm -rf .git

# add exports
sed -i 's/^declare/export declare/g' ./src/gameTypes/*.ts
sed -i 's/^interface/export interface/g' ./src/gameTypes/*.ts
sed -i 's/^namespace/export namespace/g' ./src/gameTypes/*.ts
sed -i 's/^type/export type/g' ./src/gameTypes/*.ts

# mv declarations to source files
mv src/gameTypes/*.d.ts built/
mv src/libraryTypes/*.d.ts lib/
rm -rf src

# create declarations
# npm run declarations
