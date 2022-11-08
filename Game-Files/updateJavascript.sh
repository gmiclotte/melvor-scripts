# directory in the repo that we are interested in
parent="melvor"
dir="${parent}/assets/js/"
dataDir="${parent}/assets/data/"

# clean up
rm -rf built data game

# download game files through git, clean up afterwards
git init
git remote add -f origin git@github.com:gmiclotte/melvoridle.com.git
git config core.sparseCheckout true
{ echo ${dir}; echo ${dataDir}; } >> .git/info/sparse-checkout
echo ${parent}/version >> .git/info/sparse-checkout
git pull origin master
rm -rf .git

# remove unnecessary directory nesting
mv ${dir}/* .
mv ${dataDir}/ .
mv ${parent}/version .
rm -r ${parent}
mkdir lib
mv ./*.js lib

# enable globstar for recursive globbing
shopt -s globstar

# add exports
sed -i 's/^class/export class/g' ./**/*.js
sed -i 's/^function/export function/g' ./**/*.js
sed -i 's/^const/export const/g' ./**/*.js