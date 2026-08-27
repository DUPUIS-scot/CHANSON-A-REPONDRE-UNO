#include "FxProcessor.h"
namespace {
juce::AudioProcessorValueTreeState::ParameterLayout fxLayout() {
  using F=juce::AudioParameterFloat;
  return {
    std::make_unique<F>("mix","2MIX Balance",juce::NormalisableRange<float>(-1.f,1.f),0.f),
    std::make_unique<F>("modDepth","MOD DEPTH",juce::NormalisableRange<float>(0.f,1.f),0.f),
    std::make_unique<F>("fxMix","FX MIX",juce::NormalisableRange<float>(0.f,1.f),1.f),
    std::make_unique<F>("drive","DRIVE",juce::NormalisableRange<float>(0.f,1.f),0.f),
    std::make_unique<F>("output","OUTPUT",juce::NormalisableRange<float>(-24.f,12.f),0.f)
  };
}}
EnochianTerminalFxAudioProcessor::EnochianTerminalFxAudioProcessor()
 : AudioProcessor(BusesProperties().withInput("Input",juce::AudioChannelSet::stereo(),true).withOutput("Output",juce::AudioChannelSet::stereo(),true)),
   parameters(*this,nullptr,"ENOCHIAN_FX",fxLayout()) {}
void EnochianTerminalFxAudioProcessor::prepareToPlay(double rate,int) { wetGain.reset(rate,.02); }
bool EnochianTerminalFxAudioProcessor::isBusesLayoutSupported(const BusesLayout& l) const { return l.getMainInputChannelSet()==juce::AudioChannelSet::stereo()&&l.getMainOutputChannelSet()==juce::AudioChannelSet::stereo(); }
void EnochianTerminalFxAudioProcessor::processBlock(juce::AudioBuffer<float>& b,juce::MidiBuffer& midi) {
  for(const auto m:midi) if(m.getMessage().isController()) { auto v=m.getMessage().getControllerValue()/127.f; if(m.getMessage().getControllerNumber()==1)*parameters.getRawParameterValue("modDepth")=v; if(m.getMessage().getControllerNumber()==7)*parameters.getRawParameterValue("fxMix")=v; if(m.getMessage().getControllerNumber()==16)*parameters.getRawParameterValue("mix")=v*2.f-1.f; }
  const auto drive=*parameters.getRawParameterValue("drive")*5.f;
  wetGain.setTargetValue(juce::Decibels::decibelsToGain(*parameters.getRawParameterValue("output")));
  for(int c=0;c<b.getNumChannels();++c) for(int i=0;i<b.getNumSamples();++i) { auto dry=b.getSample(c,i); auto wet=std::tanh(dry*(1.f+drive)); b.setSample(c,i,dry+(wet-dry)*(*parameters.getRawParameterValue("fxMix"))*wetGain.getNextValue()); }
}
void EnochianTerminalFxAudioProcessor::getStateInformation(juce::MemoryBlock& d){juce::MemoryOutputStream(d,true).writeString(parameters.copyState().toXmlString());}
void EnochianTerminalFxAudioProcessor::setStateInformation(const void* d,int n){if(auto x=juce::parseXML(juce::String::fromUTF8(static_cast<const char*>(d),n)))parameters.replaceState(juce::ValueTree::fromXml(*x));}
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter(){ return new EnochianTerminalFxAudioProcessor(); }
