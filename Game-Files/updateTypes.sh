# clean up
rm -rf gameTypes libraryTypes

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

# mv declarations and clean up
mv src/gameTypes gameTypes
mv src/libraryTypes libraryTypes
rm -rf src