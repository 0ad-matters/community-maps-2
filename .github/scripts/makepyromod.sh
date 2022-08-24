#!/bin/sh

set -ev

echo $USER

if [ -z "${1}" ] || [ -z "${2}" ] || [ -z "${3}" ]; then
  echo "Usage: $0 <mod_name> <ver> <output-dir>"
  exit 1
fi

MOD_NAME="${1}"
MOD_VER="${2}"

if [ ! -d "${3}" ]; then
	echo "directory '${3}' doesn't exist"
	exit 1
fi

DESTFILE="${3}/${MOD_NAME}-${MOD_VER}"

for ext in pyromod zip; do
	if [ -e "${DESTFILE}".$ext ]; then
		rm "${DESTFILE}".$ext
	fi
done

if [ ! -e "$PWD/mod.json" ]; then
	echo "mod.json not found in $PWD"
	exit 1
fi

0ad -mod=community-maps-2  \
	-archivebuild=$PWD \
	-archivebuild-output="${DESTFILE}".pyromod \
	-archivebuild-compress

# If the pyromod fails to build, 0ad may return 0 in some cases, so
# check to make sure the file exists
test -e "${DESTFILE}".pyromod

zip -d "${DESTFILE}.pyromod" ".github*" || exit 1
cp "${DESTFILE}.pyromod" "${DESTFILE}.zip" || exit 1
