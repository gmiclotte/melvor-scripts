rm -f ActiveSnippets.js
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
mv ActiveSnippets ActiveSnippets.js