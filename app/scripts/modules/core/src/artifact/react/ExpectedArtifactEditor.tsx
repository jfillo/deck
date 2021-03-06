import { module } from 'angular';
import * as React from 'react';
import { react2angular } from 'react2angular';
import { cloneDeep } from 'lodash';
import { IExpectedArtifact, IArtifactAccount, IArtifactKindConfig, IArtifact } from 'core';
import { StageConfigField } from 'core/pipeline/config/stages/core/stageConfigField/StageConfigField';
import { ExpectedArtifactService } from '../expectedArtifact.service';
import {
  ExpectedArtifactKindSelector,
  EXPECTED_ARTIFACT_KIND_SELECTOR_COMPONENT_REACT,
} from './ExpectedArtifactKindSelector';
import {
  ExpectedArtifactSourceSelector,
  IExpectedArtifactSourceOption,
  EXPECTED_ARTIFACT_SOURCE_SELECTOR_COMPONENT_REACT,
} from './ExpectedArtifactSourceSelector';
import { ArtifactAccountSelector } from './ArtifactAccountSelector';

export interface IExpectedArtifactEditorProps {
  default?: IExpectedArtifact;
  kinds: IArtifactKindConfig[];
  sources: IExpectedArtifactSourceOption[];
  accounts: IArtifactAccount[];
  onSave: (e: IExpectedArtifactEditorSaveEvent) => void;
  showIcons: boolean;
  className?: string;
}

interface IExpectedArtifactEditorState {
  expectedArtifact: IExpectedArtifact;
  source?: IExpectedArtifactSourceOption;
  account?: IArtifactAccount;
}

export interface IExpectedArtifactEditorSaveEvent {
  expectedArtifact: IExpectedArtifact;
  source: IExpectedArtifactSourceOption;
  account: IArtifactAccount;
}

export class ExpectedArtifactEditor extends React.Component<
  IExpectedArtifactEditorProps,
  IExpectedArtifactEditorState
> {
  constructor(props: IExpectedArtifactEditorProps) {
    super(props);
    this.state = {
      expectedArtifact: props.default ? cloneDeep(props.default) : ExpectedArtifactService.createEmptyArtifact(null),
      source: props.sources[0],
      account: null,
    };
  }

  private onSave = () => {
    this.props.onSave({
      expectedArtifact: this.state.expectedArtifact,
      source: this.state.source,
      account: this.state.account,
    });
  };

  private accountsForExpectedArtifact(expectedArtifact: IExpectedArtifact): IArtifactAccount[] {
    const artifact = ExpectedArtifactService.artifactFromExpected(expectedArtifact);
    if (!artifact) {
      return [];
    }
    return this.props.accounts.filter(a => a.types.includes(artifact.type));
  }

  private onSourceChange = (e: IExpectedArtifactSourceOption) => {
    this.setState({ source: e });
  };

  private onKindChange = (kind: IArtifactKindConfig) => {
    const expectedArtifact = cloneDeep(this.state.expectedArtifact);
    expectedArtifact.matchArtifact.type = kind.type;
    expectedArtifact.matchArtifact.kind = kind.key;
    const accounts = this.accountsForExpectedArtifact(expectedArtifact);
    this.setState({ expectedArtifact, account: accounts[0] });
  };

  private onAccountChange = (account: IArtifactAccount) => {
    this.setState({ account });
  };

  private onArtifactEdit = (artifact: IArtifact) => {
    const expectedArtifact = { ...this.state.expectedArtifact, matchArtifact: { ...artifact } };
    let account = this.state.account;
    if (this.state.expectedArtifact.matchArtifact.type !== artifact.type) {
      const accounts = this.accountsForExpectedArtifact(expectedArtifact);
      account = accounts[0];
    }
    this.setState({ expectedArtifact, account });
  };

  private availableKinds = () => {
    const { kinds, accounts } = this.props;
    return kinds.filter(k => k.key === 'custom' || accounts.find(a => a.types.includes(k.type)));
  };

  public render() {
    const { sources } = this.props;
    const { expectedArtifact, source, account } = this.state;
    const accounts = this.accountsForExpectedArtifact(expectedArtifact);
    const artifact = ExpectedArtifactService.artifactFromExpected(expectedArtifact);
    const kinds = this.availableKinds().sort((a, b) => a.label.localeCompare(b.label));
    const kind = artifact ? kinds.find(k => k.key === artifact.kind) : null;
    const EditCmp = kind && kind.editCmp;
    return (
      <>
        <StageConfigField label="Artifact Source" fieldColumns={8}>
          <ExpectedArtifactSourceSelector sources={sources} selected={source} onChange={this.onSourceChange} />
        </StageConfigField>
        <StageConfigField label="Artifact Type" fieldColumns={8}>
          <ExpectedArtifactKindSelector kinds={kinds} selected={kind} onChange={this.onKindChange} />
        </StageConfigField>
        <StageConfigField label="Artifact Account" fieldColumns={8}>
          <ArtifactAccountSelector accounts={accounts} selected={account} onChange={this.onAccountChange} />
        </StageConfigField>
        {EditCmp && <EditCmp artifact={artifact} onChange={this.onArtifactEdit} labelColumns={3} fieldColumns={3} />}
        <StageConfigField label="" fieldColumns={8}>
          <button onClick={this.onSave} className="btn btn-block btn-primary btn-sm">
            Confirm
          </button>
        </StageConfigField>
      </>
    );
  }
}

export const EXPECTED_ARTIFACT_EDITOR_COMPONENT_REACT = 'spinnaker.core.artifacts.expected.editor.react';
module(EXPECTED_ARTIFACT_EDITOR_COMPONENT_REACT, [
  EXPECTED_ARTIFACT_KIND_SELECTOR_COMPONENT_REACT,
  EXPECTED_ARTIFACT_SOURCE_SELECTOR_COMPONENT_REACT,
]).component(
  'expectedArtifactEditorReact',
  react2angular(ExpectedArtifactEditor, [
    'default',
    'kinds',
    'sources',
    'accounts',
    'onSave',
    'showIcons',
    'className',
  ]),
);
