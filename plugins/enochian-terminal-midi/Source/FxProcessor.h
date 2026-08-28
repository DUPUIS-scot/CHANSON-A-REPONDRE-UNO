#pragma once
#include <JuceHeader.h>

class EnochianTerminalFxAudioProcessor final : public juce::AudioProcessor {
public:
    EnochianTerminalFxAudioProcessor();
    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    void releaseResources() override {}
    bool isBusesLayoutSupported (const BusesLayout&) const override;
    juce::AudioProcessorEditor* createEditor() override { return new juce::GenericAudioProcessorEditor(*this); }
    bool hasEditor() const override { return true; }
    const juce::String getName() const override { return "ENOCHIAN TERMINAL FX"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }
    int getNumPrograms() override { return 1; } int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {} const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int,const juce::String&) override {}
    void getStateInformation(juce::MemoryBlock&) override;
    void setStateInformation(const void*,int) override;
private:
    juce::AudioProcessorValueTreeState parameters;
    juce::SmoothedValue<float> wetGain;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(EnochianTerminalFxAudioProcessor)
};