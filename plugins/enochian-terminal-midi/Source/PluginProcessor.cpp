#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace {
juce::AudioProcessorValueTreeState::ParameterLayout makeLayout() {
    using P = juce::AudioParameterFloat;
    using B = juce::AudioParameterBool;
    return {
        std::make_unique<P>("mix", "2MIX Balance", juce::NormalisableRange<float>(-1.f, 1.f), 0.f),
        std::make_unique<P>("low", "LOW EQ", juce::NormalisableRange<float>(-24.f, 12.f), 0.f),
        std::make_unique<P>("mid", "MID EQ", juce::NormalisableRange<float>(-24.f, 12.f), 0.f),
        std::make_unique<P>("high", "HIGH EQ", juce::NormalisableRange<float>(-24.f, 12.f), 0.f),
        std::make_unique<P>("modDepth", "MOD DEPTH", juce::NormalisableRange<float>(0.f, 1.f), 0.f),
        std::make_unique<P>("fxMix", "FX MIX", juce::NormalisableRange<float>(0.f, 1.f), 0.f),
        std::make_unique<P>("pitch", "PITCH", juce::NormalisableRange<float>(-8.f, 8.f), 0.f),
        std::make_unique<B>("loop", "LOOP", false)
    };
}
}

EnochianTerminalMidiAudioProcessor::EnochianTerminalMidiAudioProcessor()
 : AudioProcessor (BusesProperties().withOutput ("Master", juce::AudioChannelSet::stereo(), true)),
   parameters (*this, nullptr, "ENOCHIAN", makeLayout()) {}

void EnochianTerminalMidiAudioProcessor::prepareToPlay (double, int) {}
bool EnochianTerminalMidiAudioProcessor::isBusesLayoutSupported (const BusesLayout& l) const {
    return l.getMainOutputChannelSet() == juce::AudioChannelSet::stereo();
}
void EnochianTerminalMidiAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) {
    buffer.clear(); // audio stem engine connects here; MIDI control is already host-safe.
    handleMidi(midi);
}
void EnochianTerminalMidiAudioProcessor::handleMidi (const juce::MidiBuffer& midi) {
    for (const auto metadata : midi) {
        const auto message = metadata.getMessage();
        if (message.isNoteOn()) {
            const auto n = message.getNoteNumber();
            if (n == 36) playing.store(!playing.load());          // transport
            else if (n == 37) cue.store(true);                    // cue
            else if (n >= 40 && n <= 47) activeStem.store(n - 39); // 2JESTER pads
        } else if (message.isController()) {
            const auto value = message.getControllerValue() / 127.f;
            switch (message.getControllerNumber()) {
                case 1: *parameters.getRawParameterValue("modDepth") = value; break;
                case 7: *parameters.getRawParameterValue("fxMix") = value; break;
                case 16: *parameters.getRawParameterValue("mix") = value * 2.f - 1.f; break;
                case 20: *parameters.getRawParameterValue("low") = value * 36.f - 24.f; break;
                case 21: *parameters.getRawParameterValue("mid") = value * 36.f - 24.f; break;
                case 22: *parameters.getRawParameterValue("high") = value * 36.f - 24.f; break;
            }
        }
    }
}
juce::AudioProcessorEditor* EnochianTerminalMidiAudioProcessor::createEditor() { return new EnochianTerminalMidiAudioProcessorEditor(*this); }
void EnochianTerminalMidiAudioProcessor::getStateInformation (juce::MemoryBlock& data) { juce::MemoryOutputStream(data, true).writeString(parameters.copyState().toXmlString()); }
void EnochianTerminalMidiAudioProcessor::setStateInformation (const void* data, int size) { if (auto xml = juce::parseXML(juce::String::fromUTF8(static_cast<const char*>(data), size))) parameters.replaceState(juce::ValueTree::fromXml(*xml)); }
juce::String EnochianTerminalMidiAudioProcessor::statusText() const { return (playing ? "PLAYING" : "READY") + juce::String(" · STEM ") + juce::String(activeStem.load()); }