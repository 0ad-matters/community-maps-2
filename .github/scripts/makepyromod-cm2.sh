#!/bin/sh

set -ev

echo $USER

if [ -z "${1}" ]; then
  echo "Usage: $0 <ver> <destdir>"
  exit 1
fi

if [ -z "${2}" ]; then
	echo "supply a destination folder"
	exit 1
elif [ ! -d "${2}" ]; then
	echo "directory '${2}' doesn't exist"
	exit 1
fi

DESTDIR="${2}"
VER="${1}"
OUTFILE="community-maps-2-${VER}"

for ext in pyromod zip; do
	if [ -e "${DESTDIR}"/"${OUTFILE}".$ext ]; then
		rm "${DESTDIR}"/"${OUTFILE}".$ext
	fi
done

if [ ! -e "$PWD/mod.json" ]; then
	echo "mod.json not found in $PWD"
	exit 1
fi

0ad -mod=community-maps-2  \
	-archivebuild=$PWD \
	-archivebuild-output="${DESTDIR}"/"${OUTFILE}".pyromod \
	-archivebuild-compress

# If the pyromod fails to build, 0ad returns 0, so do an extra check to make
# sure the fail exists
test -e "${DESTDIR}"/"${OUTFILE}".pyromod

if [ "${VER}" != "test" ]; then
	zip -d "${DESTDIR}/${OUTFILE}.pyromod" ".github*"
	cp "${DESTDIR}/${OUTFILE}.pyromod" "${DESTDIR}/${OUTFILE}.zip"
else
	rm "${DESTDIR}"/"${OUTFILE}".pyromod
fi
