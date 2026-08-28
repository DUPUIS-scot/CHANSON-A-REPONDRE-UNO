#pragma once
#include <JuceHeader.h>

class EnochianTerminalMidiAudioProcessor final : public juce::AudioProcessor {
public:
    EnochianTerminalMidiAudioProcessor();
    ~EnochianTerminalMidiAudioProcessor() override = default;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}
    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }
    const juce::String getName() const override { return "ENOCHIAN TERMINAL MIDI"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}
    void getStateInformation (juce::MemoryBlock&) override;
    void setStateInformation (const void*, int) override;

    juce::AudioProcessorValueTreeState parameters;
    juce::String statusText() const;
private:
    void handleMidi (const juce::MidiBuffer&);
    std::atomic<bool> playing { false };
    std::atomic<bool> cue { false };
    std::atomic<int> activeStem { 0 };
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (EnochianTerminalMidiAudioProcessor)
};