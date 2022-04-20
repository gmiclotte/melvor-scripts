rm -f ActiveSnippets.js
rm -f JuniorFarmer.js

# create ActiveSnippets
cat Wrapper.js.header > ActiveSnippets
for f in *.js; do
    echo "" >> ActiveSnippets
    echo `python -c "print('/' * (${#f} + 4))"` >> ActiveSnippets
    echo "//${f}//" >> ActiveSnippets
    echo `python -c "print('/' * (${#f} + 4))"` >> ActiveSnippets
    echo "snippet.name = '${f}';" >> ActiveSnippets
    echo "snippet.start();" >> ActiveSnippets
    cat ${f} | sed 's/console/snippet/g' >> ActiveSnippets
    echo "snippet.end();" >> ActiveSnippets
done
cat Wrapper.js.footer >> ActiveSnippets

# create JuniorFarmer
cat Wrapper.js.header > JuniorFarmer
for f in LootDrops.js RerollJuniorFarmer.js RerollSlayer.js; do
    echo "" >> JuniorFarmer
    echo `python -c "print('/' * (${#f} + 4))"` >> JuniorFarmer
    echo "//${f}//" >> JuniorFarmer
    echo `python -c "print('/' * (${#f} + 4))"` >> JuniorFarmer
    echo "snippet.name = '${f}';" >> JuniorFarmer
    echo "snippet.start();" >> JuniorFarmer
    cat ${f} | sed 's/console/snippet/g' >> JuniorFarmer
    echo "snippet.end();" >> JuniorFarmer
done
cat Wrapper.js.footer >> JuniorFarmer
sed -i 's/Snippets/JuniorFarmer/g' JuniorFarmer
sed -i 's/snippet/juniorFarmer/g' JuniorFarmer
sed -i 's#// window.rerollJuniorFarmer();#window.rerollJuniorFarmer();#g' JuniorFarmer

# move combined files to js files
mv ActiveSnippets ActiveSnippets.js
mv JuniorFarmer JuniorFarmer.js