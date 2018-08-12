for i in {0..364}
#for i in {0..20}
do
	fetchDate=$(date -v+${i}d '+%m%d')
	echo `node wikiDateParser.js $fetchDate`
	#$(node wikiDateParser.js fetchDate)
done
