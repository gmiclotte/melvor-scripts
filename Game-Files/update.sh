# directory in the repo that we are interested in
parent="melvor-test"
dir="${parent}/assets/js/"

# clean up
rm -r game built lib

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

# create declarations
npm run declarations
