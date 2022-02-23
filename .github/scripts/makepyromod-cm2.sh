#!/bin/sh

set -ev

if test -z $1; then
  echo "supply a version number"
  exit 1
fi

0ad -mod=community-maps-2  \
	-archivebuild=$PWD \
	-archivebuild-output=$HOME/community-maps-2-${1}.pyromod \
	-archivebuild-compress

test -e $HOME/community-maps-2-${1}.pyromod
rm $HOME/community-maps-2-${1}.pyromod

