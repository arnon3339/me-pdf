# syntax=docker/dockerfile-upstream:master-labs
# ──────────────────────────────────────────────────────────────────────────────
# 1.  Base emsdk image – all compilation happens on top of this.
# ──────────────────────────────────────────────────────────────────────────────
FROM emscripten/emsdk:3.1.70 AS emsdk-base

ARG  DEBIAN_FRONTEND=noninteractive
ARG  EXTRA_CFLAGS
ARG  EXTRA_LDFLAGS

ENV  INSTALL_DIR=/opt
ENV  CFLAGS="-I$INSTALL_DIR/include $CFLAGS $EXTRA_CFLAGS"
ENV  CXXFLAGS="$CFLAGS"
ENV  LDFLAGS="-L$INSTALL_DIR/lib $LDFLAGS $CFLAGS $EXTRA_LDFLAGS"
ENV  EM_PKG_CONFIG_PATH=$INSTALL_DIR/lib/pkgconfig:/emsdk/upstream/emscripten/system/lib/pkgconfig
ENV  EM_TOOLCHAIN_FILE=$EMSDK/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake
ENV  PKG_CONFIG_PATH=$PKG_CONFIG_PATH:$EM_PKG_CONFIG_PATH
ENV  PATH="/emsdk/upstream/bin:${PATH}"

RUN  apt-get update && \
     apt-get install -y --no-install-recommends \
         pkg-config autoconf automake libtool ragel git yasm \
         subversion lsb-release tzdata keyboard-configuration

# locale & timezone
RUN  echo "America/Sao_Paulo" >/etc/timezone && \
     dpkg-reconfigure -f noninteractive tzdata && \
     printf 'LANG="en_US.UTF-8"\n' >/etc/default/local

# ──────────────────────────────────────────────────────────────────────────────
# 2.  Node.js – needed by the generator scripts.
# ──────────────────────────────────────────────────────────────────────────────
FROM emsdk-base AS node-setup
RUN  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && \
     sudo apt-get install -y nodejs

# ──────────────────────────────────────────────────────────────────────────────
# 3.  depot_tools – GN / Ninja / gclient live here.
# ──────────────────────────────────────────────────────────────────────────────
FROM node-setup AS depot-tools
RUN  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git \
         -b main /opt/depot-tools
ENV  PATH=${PATH}:/opt/depot-tools

# ──────────────────────────────────────────────────────────────────────────────
# 4.  Fetch PDFium source (shallow, pinned to chromium/7188).
# ──────────────────────────────────────────────────────────────────────────────
FROM depot-tools AS pdfium-src
WORKDIR /build
RUN  gclient config --unmanaged https://pdfium.googlesource.com/pdfium.git
RUN  gclient sync -r origin/chromium/7188 --no-history --shallow

# ──────────────────────────────────────────────────────────────────────────────
# 5.  Install PDFium build dependencies.
# ──────────────────────────────────────────────────────────────────────────────
FROM pdfium-src AS pdfium-deps
RUN  bash -x ./pdfium/build/install-build-deps.sh --no-prompt

# ──────────────────────────────────────────────────────────────────────────────
# 6.  Apply local patches (toolchain, BUILD.gn tweaks, …).
# ──────────────────────────────────────────────────────────────────────────────
FROM pdfium-deps AS pdfium-patch
COPY build/patch/BUILD.gn                                   /build/pdfium/BUILD.gn
COPY build/patch/build/config/BUILDCONFIG.gn                /build/pdfium/build/config/BUILDCONFIG.gn
COPY build/patch/build/toolchain/wasm/BUILD.gn              /build/pdfium/build/toolchain/wasm/BUILD.gn
COPY build/patch/core/fxge/BUILD.gn                         /build/pdfium/core/fxge/BUILD.gn

# ──────────────────────────────────────────────────────────────────────────────
# 7.  GN + Ninja – build libpdfium.a for the wasm toolchain.
# ──────────────────────────────────────────────────────────────────────────────
FROM pdfium-patch AS pdfium-compile
WORKDIR /build/pdfium

RUN  rm -rf out/prod && \
     gn gen out/prod --args='is_debug=false treat_warnings_as_errors=false \
         pdf_use_skia=false pdf_enable_xfa=false pdf_enable_v8=false \
         is_component_build=false clang_use_chrome_plugins=false \
         pdf_is_standalone=true use_debug_fission=false use_custom_libcxx=false \
         use_sysroot=false pdf_is_complete_lib=true pdf_use_partition_alloc=false \
         is_clang=false symbol_level=0' && \
     echo 'target_os="wasm"'  >>out/prod/args.gn && \
     echo 'target_cpu="wasm"' >>out/prod/args.gn && \
     ninja -C out/prod pdfium -v

# ──────────────────────────────────────────────────────────────────────────────
# 8.  Generate export lists via **Clang AST**  + compile WASM wrappers.
# ──────────────────────────────────────────────────────────────────────────────
FROM pdfium-compile AS pdfium-wasm

WORKDIR /build/wasm

# 8.1 – OS tools we still need
RUN  apt-get update && apt-get install -y --no-install-recommends clang

# 8.2 – C++ glue sources
COPY build/code/cpp/*.h                                .
COPY build/code/cpp/*.cpp                              .

# 8.3 – compile helpers
COPY build/compile.sh  build/compile.esm.sh            ./

# 8.4 – AST-based generators
COPY build/generate-functions.mjs                ./
COPY build/generate-runtime-methods.mjs ./

# 8.5 – Dump the AST of *all* public headers as one TU
RUN  ( cd /build/pdfium && \
        find public -path 'public/cpp' -prune -o -name '*.h' -print | \
        sort | sed 's|^|#include "|;s|$|"|' ) >all.h && \
     echo '#include "ext_api.h"' >>all.h && \
     clang -std=c11 -I/build/pdfium -I/build/wasm \
           -fsyntax-only -Xclang -ast-dump=json \
           all.h >ast.json

# 8.6 – Produce   exported-functions.txt / functions.ts   from the JSON
RUN  node ./generate-functions.mjs ./ast.json ./                  && \
     node ./generate-runtime-methods.mjs ./

# 8.7 – final em++ link (CJS + ESM variants)
RUN  bash -E ./compile.sh && \
     bash -E ./compile.esm.sh

# ──────────────────────────────────────────────────────────────────────────────
# 9.  Scratch stage – publish artefacts (WASM, JS, headers, …).
# ──────────────────────────────────────────────────────────────────────────────
FROM scratch AS exportor
# compiled JS/WASM + generated TS helpers
COPY --from=pdfium-wasm /build/wasm                     /dist
# C headers (public/)
COPY --from=pdfium-wasm /build/pdfium/public            /dist/pdfium
# Emscripten sysroot headers (optional convenience)
COPY --from=pdfium-wasm /emsdk/upstream/emscripten/cache/sysroot/include \
                                                            /dist/emscripten
