#pragma once
#include "PluginProcessor.h"

class EnochianTerminalMidiAudioProcessorEditor final : public juce::AudioProcessorEditor,
                                                       private juce::Timer {
public:
    explicit EnochianTerminalMidiAudioProcessorEditor (EnochianTerminalMidiAudioProcessor&);
    void paint (juce::Graphics&) override;
    void resized() override;
private:
    void timerCallback() override;
    EnochianTerminalMidiAudioProcessor& processor;
    juce::Label status;
    juce::Slider mix, modDepth, fxMix;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (EnochianTerminalMidiAudioProcessorEditor)
};