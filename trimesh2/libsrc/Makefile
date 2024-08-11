DESTDIR = ../lib.$(UNAME)
DRACO_DIR = ../../draco
INCLUDES = -I../include \
           -I$(DRACO_DIR)/build \
           -I$(DRACO_DIR)/src \
           -I$(DRACO_DIR)/src/draco \
           -I$(DRACO_DIR)/src/draco/compression \
           -I$(DRACO_DIR)/src/draco/compression/config

LIBS = -L$(DRACO_DIR)/build -ldraco

include ../Makerules

CCFILES =    TriMesh_bounding.cc \
             TriMesh_connectivity.cc \
             TriMesh_curvature.cc \
             TriMesh_io.cc \
             TriMesh_grid.cc \
             TriMesh_normals.cc \
             TriMesh_pointareas.cc \
             TriMesh_stats.cc \
             TriMesh_tstrips.cc \
             GLCamera.cc \
             GLManager.cc \
             ICP.cc \
             KDtree.cc \
             conn_comps.cc \
             diffuse.cc \
             edgeflip.cc \
             faceflip.cc \
             filter.cc \
             make.cc \
             merge.cc \
             overlap.cc \
             remove.cc \
             reorder_verts.cc \
             subdiv.cc \
             umbrella.cc

OFILES = $(addprefix $(OBJDIR)/,$(CCFILES:.cc=.o))
LIB = $(DESTDIR)/libtrimesh.a
default: $(LIB)

$(LIB): $(OFILES)
	$(STATICLIB) $(LIBS)

clean:
	-rm -f $(OBJDIR)/*.o $(OBJDIR)/*.d
	-rmdir $(OBJDIR)

spotless: clean
	-rm -f $(LIB)
	-rmdir $(DESTDIR)