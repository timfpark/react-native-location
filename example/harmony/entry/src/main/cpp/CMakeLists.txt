project(rnapp)
cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_SKIP_BUILD_RPATH TRUE)
set(NATIVERENDER_ROOT_PATH "${CMAKE_CURRENT_SOURCE_DIR}")
# 注意：路径必须先以绝对锚点（CMAKE_CURRENT_SOURCE_DIR）拼接、再归一化（去除 .. 段）。
# get_filename_component(ABSOLUTE) 对相对输入按 cmake 进程的「当前工作目录」解析——
# hvigor 守护进程与终端的 cwd 不同，会导致同一相对路径解析出不同结果
# （表现为 oh_modules 路径时有时无、autolinking 的 add_subdirectory 随机失败）。
get_filename_component(OH_MODULE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules" ABSOLUTE)
set(OH_MODULES_DIR "${OH_MODULE_DIR}")
set(RNOH_APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}")
set(RNOH_GENERATED_DIR "${CMAKE_CURRENT_SOURCE_DIR}/generated")
set(RNOH_CPP_DIR "${OH_MODULE_DIR}/@rnoh/react-native-openharmony/src/main/cpp")
set(CMAKE_CXX_STANDARD 17)
set(LOG_VERBOSITY_LEVEL 1)
set(CMAKE_ASM_FLAGS "-Wno-error=unused-command-line-argument -Qunused-arguments")
set(CMAKE_CXX_FLAGS "-fstack-protector-strong -Wl,-z,relro,-z,now,-z,noexecstack -s -fPIE -pie -DNDEBUG")
set(WITH_HITRACE_SYSTRACE 1)
add_compile_definitions(WITH_HITRACE_SYSTRACE)
add_compile_options("-Wno-unused-command-line-argument")

# RNOH 0.84.x 的 Debug 构建宏传播缺口：react_renderer_debug 在 Debug 下以 PUBLIC
# 定义 RN_ENABLE_DEBUG_STRING_CONVERTIBLE，但该定义只传播给链接它的目标
# （rrc_* / react_renderer_core 等），react_renderer_graphics 不链接它——
# LinearGradient/RadialGradient::toString 的定义在 graphics 目标内被
# #if RN_DEBUG_STRING_CONVERTIBLE 裁剪，而带宏目标仍在引用，
# 导致 libreactnative.so 链接失败（undefined symbol，仅 Debug 复现）。
# 这里在 add_subdirectory 前全局补齐该宏，保证所有目标闸门一致（与
# react_renderer_debug/CMakeLists.txt 的 Debug 语义一致；Release 不定义）。
if(CMAKE_BUILD_TYPE MATCHES "Debug" OR RN_ENABLE_DEBUG_STRING_CONVERTIBLE)
  add_compile_definitions(RN_ENABLE_DEBUG_STRING_CONVERTIBLE)
endif()

# RNOH 以源码方式编译（folly/boost/ReactCommon 等三方源码由 RNOH 自己的
# CMakeLists 管理，本文件不再单独引用其头文件与源文件）。
add_subdirectory("${RNOH_CPP_DIR}" ./rn)

# RNOH 0.82 的 autolink 对「包名与模块名不一致」的包按 pkg--module 目录约定生成
# add_subdirectory 路径（见生成的 autolinking.cmake）；location 包为 0.72 格式、
# 解包后无该别名目录。这里在 include autolinking 之前建目录 junction 兜底，
# 使 0.72 格式包在 0.82 autolink 下可正常编译。
if(WIN32 AND NOT EXISTS "${OH_MODULES_DIR}/@react-native-ohos/react-native-location--location")
  execute_process(
    COMMAND cmd /c mklink /J
      "${OH_MODULES_DIR}/@react-native-ohos/react-native-location--location"
      "${OH_MODULES_DIR}/@react-native-ohos/react-native-location"
    RESULT_VARIABLE location_alias_junction_result
    OUTPUT_QUIET ERROR_QUIET
  )
  message(STATUS "location alias junction created: ${location_alias_junction_result}")
endif()

include("${CMAKE_CURRENT_SOURCE_DIR}/autolinking.cmake")

file(GLOB GENERATED_CPP_FILES "./generated/*.cpp")

add_library(rnoh_app SHARED
    ${GENERATED_CPP_FILES}
    "./PackageProvider.cpp"
    "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)

target_link_libraries(rnoh_app PUBLIC rnoh)
autolink_libraries(rnoh_app)
