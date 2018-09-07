import React, { Component } from 'react';
import * as IzanamiServices from "../services/index";
import { Table, SimpleBooleanInput, TextInput, NumberInput} from '../inputs';
import {CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area} from 'recharts';
//import ReactSlider from 'react-slider';
// FIXME : this is a fork of react-slider to fix a bug. Waiting for a PR to be merged
import ReactSlider from '../components/ReactSlider';
import _ from 'lodash';
import moment from 'moment';

class Variant extends Component {
  render() {
    const variant = this.props.variant;
    return (
      <div className="col-xs-12 col-sm-4">
        <div className="panel" style={{borderColor:"purple"}}>
            <div className="panel-heading" style={{backgroundColor:"purple"}}>
              <h3 className="panel-title pull-left">Traffic</h3>
              <span className="input-group-btn">
                  <button type="button" className="btn btn-sm btn-danger" onClick={e => this.props.remove()}>
                      <i className="glyphicon glyphicon-trash"/>
                  </button>
              </span>
            </div>
            <div className="panel-body">
                <TextInput label="Id" value={this.props.variant.id} onChange={value => this.props.onChange({ ...variant, id: value })} />
                <TextInput label="Name" value={this.props.variant.name} onChange={value => this.props.onChange({ ...variant, name: value })} />
                <TextInput label="Traffic" value={`${Math.round(this.props.variant.traffic * 100)} %`} disabled={true}/>
                <NumberInput label="Traffic" value={this.props.variant.traffic} onChange={value => this.props.onChange({ ...variant, traffic: value })} />
            </div>
        </div>
      </div>
    );
  }
}

const round = (v) => {
    return Math.round(v * 100) / 100
};

const trafficSum = (variants) => {
    return variants.reduce((acc, e) => acc + e.traffic, 0);
};

class Variants extends Component {

  static letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  nextLetter = () => {
      const lastLetter = this.props.source.variants[this.props.source.variants.length-1].id;
      return Variants.letters[Variants.letters.indexOf(lastLetter) + 1];
  };

  getNextTraffic = () => {
      const traffic =  1 / (this.props.source.variants.length + 1);
      return round(traffic);
  };

  reaffectTraffic = (variants) => {
    if(variants.length > 1) {
        const [first, ...rest] = variants;
        const traffic = round(1 / variants.length);
        const allTraffic = (variants.length - 1) * traffic;
        const remainingTraffic = round(1 - allTraffic);
        return [{...first, traffic: remainingTraffic}, ...rest.map(v => ({...v, traffic}))];
    } else if (variants.length === 1) {
        return [{...variants[0], traffic: 100}];
    } else {
        return [];
    }
  };

  componentDidMount() {
    //if (trafficSum(this.props.value) < 1) {
      //const variants = this.reaffectTraffic(this.props.value);
      //this.props.onChange([...variants]);
    //}
  }

  componentWillReceiveProps(nextProps) {
      if (trafficSum(nextProps.value) < 1) {
          const variants = this.reaffectTraffic(nextProps.value);
          this.props.onChange([...variants]);
      }
  }

  trafficStack = () => {
      let stack = this.props.value
          .reduce(
              ([s, acc], e) => {
                const value = s + (e.traffic * 100);
                const newState = {id: e.id, traffic: value};
                return [value, [...acc, newState]];
              },
              [0, [{id:'', traffic: 0}]]
          );
      return stack[1];
  };

  updateTraffic = ([first, ...values]) => {
    const variants = values.reduce(
        ([s, acc], p, i) => {
          const percentage = p - s;
          const traffic = round(percentage / 100);

          const variant = this.props.value[i];
          return [s + percentage, [...acc, {...variant, traffic}]];
        },
        [0, []]
    );
    this.props.onChange([...variants[1]]);
  };

  render() {
    const variants = [ ...this.props.source.variants ];
    variants.sort((a, b) => {
      return a.id.localeCompare(b.id);
    });
    const trafficStack = this.trafficStack();
    return (
      <div>
        <hr/>
        <div className="row" >
          <div className="form-group">
            <label htmlFor="input-Name" className="col-sm-2 control-label">Traffic allocation</label>
            <div className="col-sm-8">
              <div style={{margin: '20px 10px'}}>
                <ReactSlider
                    className="horizontal-slider"
                    withBars={true}
                    defaultValue={trafficStack.map(i => i.traffic)}
                    value={trafficStack.map(i => i.traffic)}
                    onChange={this.updateTraffic}
                    orientation="horizontal"
                    min={0}
                    max={100}>
                    {trafficStack.map((t, i) =>
                        <div key={`trafic-slider-${t}-${i}`}>
                            { `${t.id ? `${t.id}: `: '' } ${t.traffic}` }
                        </div>
                    )}
                </ReactSlider>

              </div>
            </div>
            <div className="col-sm-2">
              <button
                  type="button"
                  className="btn btn-sm btn-block btn-primary"
                  onClick={() => {
                      const id = this.nextLetter();
                      const traffic = this.getNextTraffic();
                      const updated = this.props.value.map(v => ({...v, traffic}));
                      const allTraffic = updated.map(v => v.traffic).reduce((acc, e) => acc + e, 0);
                      const remainingTraffic = round(1 - allTraffic);
                      return this.props.onChange([ ...updated, {id, name: `Variant ${id}`, traffic: remainingTraffic}])
                  }}
                  style={{marginRight: "0px"}}
              >
                    <i className="glyphicon glyphicon-plus-sign"/> Add traffic segment
              </button>
            </div>
          </div>
        </div>
        <div className="row" >
          {variants.map( (v, i) =>
              <Variant key={ `variants-${v.id}-${i}`} 
                       variant={v}
                       remove = { () =>
                           this.props.onChange([ ...this.props.value.filter(variant => v.id !== variant.id)])
                       }
                       onChange={variant =>
                           this.props.onChange([ ...this.props.value.filter(v => v.id !== variant.id), variant ])
                       } 
              />
          )}
        </div>
      </div>
    );
  }
}

export class ExperimentsPage extends Component {

  colors = [
    '#95cf3d',
    '#027cc3',
    '#ff8900',
    '#d50200',
    '#7cb5ec',
    '#8085c9',
    '#ffeb3b',
    '#8a2be2',
    '#a52a2a',
    '#deb887',
  ];

  state = {
    results: null
  };

  formSchema = {
    id: { type: 'string', props: { label: 'Id', placeholder: 'The Experiment id' }, error : { key : 'obj.id'}},
    name: { type: 'string', props: { label: 'Name', placeholder: 'The Experiment name' }, error : { key : 'obj.name'}},
    description: { type: 'string', props: { label: 'Description', placeholder: 'The Experiment description' }, error : { key : 'obj.description'}},
    enabled: { type: 'bool', props: { label: 'Active', placeholder: `Experiment active` }, error : { key : 'obj.enabled'}},
    variants: { type: Variants, props: { label: 'Variants' }, error : { key : 'obj.variants'}},
  };

  editSchema = { ...this.formSchema, id: { ...this.formSchema.id, props: { ...this.formSchema.id.props, disabled: true } } };

  columns = [
    { title: 'Id', content: item => item.id },
    { title: 'Name', notFilterable: true, style: { textAlign: 'center'}, content: item => item.name},
    { title: 'Description', notFilterable: true, style: { textAlign: 'center', width: 300}, content: item => item.description },
    { title: 'Active', notFilterable: true, style: { textAlign: 'center', width: 50}, content: item => <SimpleBooleanInput value={item.enabled} onChange={v => {
      IzanamiServices.fetchExperiment(item.id).then(feature => {
        IzanamiServices.updateExperiment(item.id, { ...feature, enabled: v });
      })
    }} /> },
    {
      title: 'Results',
      style: { textAlign: 'center', width: 150, height: '40px'},
      notFilterable: true ,
      content: item =>
        <button type="button" className="btn btn-sm btn-success" onClick={e => this.showResults(e, item)}><i className="fa fa-line-chart" aria-hidden="true"></i> see report</button>
    },
  ];

  formFlow = [
    'id',
    'name',
    'description',
    'enabled',
    'variants'
  ];

  fetchItems = (args) => {
    const {search = [], page, pageSize} = args;
    const pattern = search.length>0 ? search.map(({id, value}) => `*${value}*`).join(",")  : "*"
    return IzanamiServices.fetchExperiments({page, pageSize, search: pattern });
  };

  fetchItem = (id) => {
    return IzanamiServices.fetchExperiment(id);
  };

  createItem = (experiment) => {
    return IzanamiServices.createExperiment(experiment);
  };

  updateItem = (experiment, experimentOriginal) => {
    return IzanamiServices.updateExperiment(experimentOriginal.id, experiment);
  };

  deleteItem = (experiment) => {
    return IzanamiServices.deleteExperiment(experiment.id, experiment);
  };

  closeResults = () => {
    this.setState({ results: null, item: null });
    this.props.setTitle("Experiments");
  };

  showResults = (e, item) => {
    IzanamiServices.fetchExperimentResult(item.id).then(results => {
      this.props.setTitle("Results for " + results.experiment.name);
      const [serieNames, data] = this.buildChartData(results);
      console.log("Results", serieNames, data);
      this.setState({ results, item, serieNames, data }, () => {
        //this.mountChart(this.chartRef)
      });
    });
  };

  buildChartData = ({results}) => {
    let serieNames = results.map(res => [res.variant.id, `${res.variant.name} (${res.variant.id})`]);

    let evts = results.flatMap(res =>
      res.events.map(e => ({
          variant: e.variantId,
          name: moment(e.date).format('YYYY-MM-DD HH:mm'),
          label: `${res.variant.name} (${res.variant.id})`,
          date: e.date,
          transformation: parseFloat(e.transformation.toFixed(2)),
          [e.variantId]: parseFloat(e.transformation.toFixed(2))
        }))
    );
    evts = _.sortBy(evts, 'date');

    results.forEach(res => {
      let transfo = 0.0;
      evts.forEach(e => {
        console.log(e, res);
        if (e.variant !== res.variant.id) {
          e[res.variant.id] = parseFloat(transfo.toFixed(2));
        } else {
          transfo = e.transformation;
        }
      });
    });
    return [serieNames, evts];
  };

  componentDidMount() {
    this.props.setTitle("Experiments");
  }

  render() {
    const results = (this.state.results || { results: []}).results;
    results.sort((a, b) => a.variant.id.localeCompare(b.variant.id));
    const population = results.reduce((a, b) => a + b.variant.currentPopulation, 0);
    return (
      <div className="col-md-12">
        {!this.state.results && (
          <div className="row">
            <Table
              defaultValue={() => ({
                id: 'project:experiments:name',
                name: 'My First experiment',
                description: 'See what people like the most about ...',
                enabled: true,
                variants: [
                  {
                    id: 'A',
                    name: 'Variant A',
                    description: 'Variant A is about ...',
                    traffic: 0.5
                  },
                  {
                    id: 'B',
                    name: 'Variant B',
                    description: 'Variant B is about ...',
                    traffic: 0.5
                  }
                ]
              })}
              parentProps={this.props}
              user={this.props.user}
              defaultTitle="Experiments"
              selfUrl="experiments"
              backToUrl="experiments"
              itemName="Experiment"
              formSchema={this.formSchema}
              editSchema={this.editSchema}
              formFlow={this.formFlow}
              columns={this.columns}
              fetchItems={this.fetchItems}
              fetchItem={this.fetchItem}
              updateItem={this.updateItem}
              deleteItem={this.deleteItem}
              createItem={this.createItem}
              downloadLinks={[
                {title: "DL experiments", link: "/api/experiments.ndjson"},
                {title: "DL events", link: "/api/experiments/events.ndjson"},
              ]}
              uploadLinks={[
                {title: "UL experiments", link: "/api/experiments.ndjson"},
                {title: "UL events", link: "/api/experiments/events.ndjson"},
              ]}
              eventNames={{
                created: 'EXPERIMENT_CREATED',
                updated: 'EXPERIMENT_UPDATED',
                deleted: 'EXPERIMENT_DELETED'
              }}
              showActions={true}
              showLink={false}
              extractKey={item => item.id} />
          </div>)}
        {this.state.results && (
          <div className="row">
            <form className="form-horizontal">
              <h4>Winner</h4>{this.state.results.winner && (<p>
                The winner of the experiment name <strong>"{this.state.results.experiment.name}"</strong> is <strong>"{this.state.results.winner.name}"</strong> (<strong>{this.state.results.winner.id}</strong>)
              </p>)}
              {!this.state.results.winner && (<p>
                There is no winner yet for the experiment name <strong>"{this.state.results.experiment.name}"</strong>
              </p>)}
              <h4>Population </h4>
              <p>
                Tested population consist of <strong>{population}</strong> users with <strong>{displays}</strong> displays
              </p>
              <h4>Variants </h4>
              <ul>
                {results.map((r, index) => (
                  <li key={index}>
                    Variant <strong><span style={{color:this.colors[index]}}>"{r.variant.name}" ({r.variant.id})</span></strong> has a conversion rate of <strong>{r.transformation.toFixed(3)} %</strong>
                    <ul>
                      <li>won <strong>{r.won}</strong> times over <strong>{r.displayed}</strong> displays</li>
                    </ul>
                  </li>
                ))}
              </ul>
            </form>
            <AreaChart width={800} height={400} data={this.state.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} >
              {this.state.serieNames.map(([k, s], i) =>
                <Area
                  type="monotone"
                  key={k}
                  dataKey={k}
                  unit={" %."}
                  stroke={this.colors[i]}
                  fillOpacity={0.6}
                  fill={this.colors[i]}
                />
              )}
              <Tooltip />
              <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#b5b3b3' }} />
              <YAxis tick={{ fill: '#b5b3b3' }}/>
            </AreaChart>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={e => this.showResults(e, this.state.item)}><i className="glyphicon glyphicon-refresh" /> Reload</button>
              <button type="button" className="btn btn-danger" onClick={this.closeResults}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
    const displays = results.reduce((a, b) => a + b.displayed, 0);
  }
}
