#!/bin/bash

output=$(make 2>&1)

error_output=$(echo "$output" | grep -E 'error')
nothing_to_be_done=$(echo "$output" | grep -E 'Nothing to be done')

if [ -n "$error_output" ]; then
  echo "Errors detected during make. Copy commands not executed."
  echo "$error_output"
elif [ -n "$nothing_to_be_done" ]; then
  sudo cp lib.Linux64/libtrimesh.a /usr/local/lib/
  sudo cp include/TriMesh_algo.h /usr/local/include/
  sudo cp include/TriMesh.h /usr/local/include/
  echo "Nothing to be done. Files copied again."
else
  sudo cp lib.Linux64/libtrimesh.a /usr/local/lib/
  sudo cp include/TriMesh_algo.h /usr/local/include/
  sudo cp include/TriMesh.h /usr/local/include/
  echo "Successfully built new Trimesh2 and copied to /usr/local/lib and /usr/local/include."
fi
