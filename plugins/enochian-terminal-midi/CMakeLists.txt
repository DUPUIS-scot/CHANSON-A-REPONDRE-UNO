cmake_minimum_required(VERSION 3.22)
project(EnochianTerminalPlugins VERSION 0.1.0)

add_subdirectory(JUCE)

function(configure_enochian_target target)
  target_compile_definitions(${target} PRIVATE JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0)
  target_link_libraries(${target} PRIVATE juce::juce_audio_utils juce::juce_dsp juce::juce_gui_extra)
endfunction()

juce_add_plugin(EnochianTerminalMidi
    COMPANY_NAME "DJ WHO" BUNDLE_ID "scot.chanson-a-repondre.enochian-terminal-midi"
    PLUGIN_MANUFACTURER_CODE DjWh PLUGIN_CODE EnMi
    FORMATS VST3 AU Standalone PRODUCT_NAME "ENOCHIAN TERMINAL MIDI"
    IS_SYNTH TRUE NEEDS_MIDI_INPUT TRUE NEEDS_MIDI_OUTPUT FALSE IS_MIDI_EFFECT FALSE COPY_PLUGIN_AFTER_BUILD TRUE)
target_sources(EnochianTerminalMidi PRIVATE Source/PluginProcessor.cpp Source/PluginProcessor.h Source/PluginEditor.cpp Source/PluginEditor.h)
configure_enochian_target(EnochianTerminalMidi)

juce_add_plugin(EnochianTerminalFx
    COMPANY_NAME "DJ WHO" BUNDLE_ID "scot.chanson-a-repondre.enochian-terminal-fx"
    PLUGIN_MANUFACTURER_CODE DjWh PLUGIN_CODE EnFx
    FORMATS VST3 AU Standalone PRODUCT_NAME "ENOCHIAN TERMINAL FX"
    IS_SYNTH FALSE NEEDS_MIDI_INPUT TRUE NEEDS_MIDI_OUTPUT FALSE IS_MIDI_EFFECT FALSE COPY_PLUGIN_AFTER_BUILD TRUE)
target_sources(EnochianTerminalFx PRIVATE Source/FxProcessor.cpp Source/FxProcessor.h)
configure_enochian_target(EnochianTerminalFx)