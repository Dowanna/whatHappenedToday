DATE=2013-05-25

for i in {0..8}
do
   NEXT_DATE=$(date +%m-%d-%Y -d "$DATE + $i day")
   echo "$NEXT_DATE"
done
